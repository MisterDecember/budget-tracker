import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { User, Account, Transaction, Debt, RecurringTransaction } from '@/types'

// Sync queue item for offline operations
interface SyncQueueItem {
  id?: number
  table: string
  operation: 'insert' | 'update' | 'delete'
  recordId: string
  data: Record<string, unknown>
  timestamp: string
  userId: string
}

interface PixelVaultDB extends DBSchema {
  users: {
    key: number
    value: User
    indexes: { 'by-username': string }
  }
  accounts: {
    key: number
    value: Account
    indexes: { 'by-userId': number; 'by-type': string }
  }
  transactions: {
    key: number
    value: Transaction
    indexes: { 'by-userId': number; 'by-accountId': number; 'by-date': string }
  }
  debts: {
    key: number
    value: Debt
    indexes: { 'by-userId': number; 'by-type': string }
  }
  recurring: {
    key: number
    value: RecurringTransaction
    indexes: { 'by-userId': number; 'by-frequency': string }
  }
  syncQueue: {
    key: number
    value: SyncQueueItem
    indexes: { 'by-userId': string; 'by-timestamp': string }
  }
  // Local cache for cloud data (keyed by cloud UUID)
  cloudCache: {
    key: string
    value: {
      id: string
      table: string
      data: Record<string, unknown>
      cachedAt: string
    }
    indexes: { 'by-table': string }
  }
}

const DB_NAME = 'PixelVaultDB'
const DB_VERSION = 2 // Bumped for new stores

let dbInstance: IDBPDatabase<PixelVaultDB> | null = null

export async function getDB(): Promise<IDBPDatabase<PixelVaultDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<PixelVaultDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Users store
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true })
        userStore.createIndex('by-username', 'username', { unique: true })
      }

      // Accounts store
      if (!db.objectStoreNames.contains('accounts')) {
        const accountStore = db.createObjectStore('accounts', { keyPath: 'id', autoIncrement: true })
        accountStore.createIndex('by-userId', 'userId')
        accountStore.createIndex('by-type', 'type')
      }

      // Transactions store
      if (!db.objectStoreNames.contains('transactions')) {
        const txStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true })
        txStore.createIndex('by-userId', 'userId')
        txStore.createIndex('by-accountId', 'accountId')
        txStore.createIndex('by-date', 'date')
      }

      // Debts store
      if (!db.objectStoreNames.contains('debts')) {
        const debtStore = db.createObjectStore('debts', { keyPath: 'id', autoIncrement: true })
        debtStore.createIndex('by-userId', 'userId')
        debtStore.createIndex('by-type', 'type')
      }

      // Recurring store
      if (!db.objectStoreNames.contains('recurring')) {
        const recurringStore = db.createObjectStore('recurring', { keyPath: 'id', autoIncrement: true })
        recurringStore.createIndex('by-userId', 'userId')
        recurringStore.createIndex('by-frequency', 'frequency')
      }

      // New in version 2: Sync queue store
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
          syncStore.createIndex('by-userId', 'userId')
          syncStore.createIndex('by-timestamp', 'timestamp')
        }

        if (!db.objectStoreNames.contains('cloudCache')) {
          const cacheStore = db.createObjectStore('cloudCache', { keyPath: 'id' })
          cacheStore.createIndex('by-table', 'table')
        }
      }
    },
  })

  return dbInstance
}

// Hash password (simple SHA-256 for demo - local auth only)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// User operations (for local-only fallback)
export async function createUser(username: string, password: string): Promise<number> {
  const db = await getDB()
  const hashedPassword = await hashPassword(password)
  const now = new Date().toISOString()
  return db.add('users', {
    username,
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
  } as User)
}

export async function verifyUser(username: string, password: string): Promise<User | null> {
  const db = await getDB()
  const user = await db.getFromIndex('users', 'by-username', username)
  if (!user) return null
  
  const hashedPassword = await hashPassword(password)
  return user.password === hashedPassword ? user : null
}

// Generic CRUD helpers
export async function addItem<T extends keyof PixelVaultDB>(
  store: T,
  data: Omit<PixelVaultDB[T]['value'], 'id' | 'createdAt' | 'updatedAt'>
): Promise<number> {
  const db = await getDB()
  const now = new Date().toISOString()
  return db.add(store, { ...data, createdAt: now, updatedAt: now } as PixelVaultDB[T]['value'])
}

export async function updateItem<T extends keyof PixelVaultDB>(
  store: T,
  data: PixelVaultDB[T]['value']
): Promise<number> {
  const db = await getDB()
  const now = new Date().toISOString()
  return db.put(store, { ...data, updatedAt: now })
}

export async function deleteItem<T extends keyof PixelVaultDB>(store: T, id: number): Promise<void> {
  const db = await getDB()
  return db.delete(store, id)
}

export async function getItem<T extends keyof PixelVaultDB>(
  store: T,
  id: number
): Promise<PixelVaultDB[T]['value'] | undefined> {
  const db = await getDB()
  return db.get(store, id)
}

export async function getAllByUserId<T extends 'accounts' | 'transactions' | 'debts' | 'recurring'>(
  store: T,
  userId: number
): Promise<PixelVaultDB[T]['value'][]> {
  const db = await getDB()
  return db.getAllFromIndex(store, 'by-userId', userId)
}

// Clear all user data (for logout/account deletion)
export async function clearUserData(userId: number): Promise<void> {
  const db = await getDB()
  
  // Get all items for user and delete them
  const stores: ('accounts' | 'transactions' | 'debts' | 'recurring')[] = 
    ['accounts', 'transactions', 'debts', 'recurring']
  
  for (const store of stores) {
    const items = await db.getAllFromIndex(store, 'by-userId', userId)
    for (const item of items) {
      if (item.id) await db.delete(store, item.id)
    }
  }
  
  // Clear sync queue for user
  const syncItems = await db.getAllFromIndex('syncQueue', 'by-userId', String(userId))
  for (const item of syncItems) {
    if (item.id) await db.delete('syncQueue', item.id)
  }
}

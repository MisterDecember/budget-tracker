import { supabase, isOnline } from './supabase'
import { getDB } from './db'
import type { Database } from '@/types/database'

// Types for sync operations
type TableName = 'accounts' | 'transactions' | 'debts' | 'recurring_transactions'
type Operation = 'insert' | 'update' | 'delete'

interface SyncQueueItem {
  id?: number
  table: TableName
  operation: Operation
  recordId: string
  data: Record<string, unknown>
  timestamp: string
  userId: string
}

interface SyncStatus {
  status: 'synced' | 'syncing' | 'offline' | 'error'
  pendingCount: number
  lastSynced: string | null
  error: string | null
}

// Sync status store (reactive)
let syncStatusListeners: ((status: SyncStatus) => void)[] = []
let currentSyncStatus: SyncStatus = {
  status: 'synced',
  pendingCount: 0,
  lastSynced: null,
  error: null
}

export function subscribeSyncStatus(listener: (status: SyncStatus) => void) {
  syncStatusListeners.push(listener)
  listener(currentSyncStatus)
  return () => {
    syncStatusListeners = syncStatusListeners.filter(l => l !== listener)
  }
}

function updateSyncStatus(partial: Partial<SyncStatus>) {
  currentSyncStatus = { ...currentSyncStatus, ...partial }
  syncStatusListeners.forEach(l => l(currentSyncStatus))
}

// Initialize sync queue in IndexedDB
export async function initSyncQueue() {
  const db = await getDB()
  // Sync queue store is created in db.ts upgrade
  return db
}

// Add item to sync queue
export async function queueSync(
  table: TableName,
  operation: Operation,
  recordId: string,
  data: Record<string, unknown>,
  userId: string
): Promise<void> {
  const db = await getDB()
  const item: SyncQueueItem = {
    table,
    operation,
    recordId,
    data,
    timestamp: new Date().toISOString(),
    userId
  }
  
  await db.add('syncQueue', item)
  const count = await db.count('syncQueue')
  updateSyncStatus({ status: 'offline', pendingCount: count })
  
  // Try to sync immediately if online
  if (isOnline()) {
    processSyncQueue(userId)
  }
}

// Process sync queue
export async function processSyncQueue(userId: string): Promise<void> {
  if (!isOnline() || !supabase) {
    updateSyncStatus({ status: 'offline' })
    return
  }
  
  const db = await getDB()
  const items = await db.getAll('syncQueue')
  const userItems = items.filter(item => item.userId === userId)
  
  if (userItems.length === 0) {
    updateSyncStatus({ status: 'synced', pendingCount: 0 })
    return
  }
  
  updateSyncStatus({ status: 'syncing', pendingCount: userItems.length })
  
  // Sort by timestamp (oldest first)
  userItems.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  
  for (const item of userItems) {
    try {
      await syncItem(item)
      // Remove from queue after successful sync
      if (item.id) {
        await db.delete('syncQueue', item.id)
      }
    } catch (error) {
      console.error('Sync error for item:', item, error)
      updateSyncStatus({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Sync failed'
      })
      // Continue with other items
    }
  }
  
  const remainingCount = await db.count('syncQueue')
  updateSyncStatus({ 
    status: remainingCount > 0 ? 'offline' : 'synced',
    pendingCount: remainingCount,
    lastSynced: new Date().toISOString(),
    error: null
  })
}

// Sync a single item to Supabase
async function syncItem(item: SyncQueueItem): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { table, operation, recordId, data } = item
  
  switch (operation) {
    case 'insert': {
      const { error } = await supabase.from(table).insert(data as Database['public']['Tables'][typeof table]['Insert'])
      if (error) throw error
      break
    }
    case 'update': {
      const { error } = await supabase.from(table).update(data as Database['public']['Tables'][typeof table]['Update']).eq('id', recordId)
      if (error) throw error
      break
    }
    case 'delete': {
      const { error } = await supabase.from(table).delete().eq('id', recordId)
      if (error) throw error
      break
    }
  }
}

// Pull data from Supabase to local
export async function pullFromCloud<T extends TableName>(
  table: T,
  userId: string
): Promise<Database['public']['Tables'][T]['Row'][]> {
  if (!supabase) return []
  
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  
  if (error) throw error
  return data as Database['public']['Tables'][T]['Row'][]
}

// Full sync: pull all data from cloud
export async function fullSync(userId: string): Promise<{
  accounts: Database['public']['Tables']['accounts']['Row'][]
  transactions: Database['public']['Tables']['transactions']['Row'][]
  debts: Database['public']['Tables']['debts']['Row'][]
  recurring: Database['public']['Tables']['recurring_transactions']['Row'][]
}> {
  if (!isOnline() || !supabase) {
    throw new Error('Cannot sync while offline')
  }
  
  updateSyncStatus({ status: 'syncing' })
  
  try {
    // First, push any pending changes
    await processSyncQueue(userId)
    
    // Then pull fresh data
    const [accounts, transactions, debts, recurring] = await Promise.all([
      pullFromCloud('accounts', userId),
      pullFromCloud('transactions', userId),
      pullFromCloud('debts', userId),
      pullFromCloud('recurring_transactions', userId)
    ])
    
    updateSyncStatus({ 
      status: 'synced', 
      lastSynced: new Date().toISOString(),
      error: null
    })
    
    return { accounts, transactions, debts, recurring }
  } catch (error) {
    updateSyncStatus({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Sync failed'
    })
    throw error
  }
}

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Back online, processing sync queue...')
    // Get current user from localStorage
    const authData = localStorage.getItem('pixelvault-auth')
    if (authData) {
      try {
        const { state } = JSON.parse(authData)
        if (state?.user?.id) {
          processSyncQueue(state.user.id)
        }
      } catch (e) {
        console.error('Failed to parse auth data:', e)
      }
    }
  })
  
  window.addEventListener('offline', () => {
    console.log('Went offline')
    updateSyncStatus({ status: 'offline' })
  })
}

// Export current status getter
export function getSyncStatus(): SyncStatus {
  return currentSyncStatus
}

import { create } from 'zustand'
import { getAllByUserId, addItem, updateItem, deleteItem, getItem } from '@/lib/db'
import { supabase, isOnline } from '@/lib/supabase'
import { subscribeSyncStatus } from '@/lib/sync'
import type { Account, Transaction, Debt, RecurringTransaction } from '@/types'

interface SyncStatus {
  status: 'synced' | 'syncing' | 'offline' | 'error'
  pendingCount: number
  lastSynced: string | null
  error: string | null
}

interface FinanceState {
  accounts: Account[]
  transactions: Transaction[]
  debts: Debt[]
  recurring: RecurringTransaction[]
  isLoading: boolean
  syncStatus: SyncStatus
  loadUserData: (userId: string, isCloudAuth: boolean) => Promise<void>
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>, userId: string, isCloudAuth: boolean) => Promise<void>
  updateAccount: (account: Account, userId: string, isCloudAuth: boolean) => Promise<void>
  deleteAccount: (id: number | string, userId: string, isCloudAuth: boolean) => Promise<void>
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>, userId: string, isCloudAuth: boolean) => Promise<void>
  updateTransaction: (transaction: Transaction, userId: string, isCloudAuth: boolean) => Promise<void>
  deleteTransaction: (id: number | string, userId: string, isCloudAuth: boolean) => Promise<void>
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>, userId: string, isCloudAuth: boolean) => Promise<void>
  updateDebt: (debt: Debt, userId: string, isCloudAuth: boolean) => Promise<void>
  deleteDebt: (id: number | string, userId: string, isCloudAuth: boolean) => Promise<void>
  addRecurring: (recurring: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>, userId: string, isCloudAuth: boolean) => Promise<void>
  updateRecurring: (recurring: RecurringTransaction, userId: string, isCloudAuth: boolean) => Promise<void>
  deleteRecurring: (id: number | string, userId: string, isCloudAuth: boolean) => Promise<void>
  setSyncStatus: (status: SyncStatus) => void
  getTotalBalance: () => number
  getTotalDebt: () => number
  getNetWorth: () => number
  getMonthlyIncome: () => number
  getMonthlyExpenses: () => number
}
// Helper functions to map Supabase snake_case to camelCase
function mapAccountFromDB(row: any): Account {
  return { id: row.id, userId: row.user_id, name: row.name, type: row.type, balance: parseFloat(row.balance) || 0, createdAt: row.created_at, updatedAt: row.updated_at }
}
function mapTransactionFromDB(row: any): Transaction {
  return { id: row.id, userId: row.user_id, accountId: row.account_id, type: row.type, description: row.description, amount: parseFloat(row.amount) || 0, category: row.category, date: row.date, notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at }
}
function mapDebtFromDB(row: any): Debt {
  return { id: row.id, userId: row.user_id, name: row.name, type: row.type, originalBalance: parseFloat(row.original_balance) || 0, currentBalance: parseFloat(row.current_balance) || 0, interestRate: parseFloat(row.interest_rate) || 0, minimumPayment: parseFloat(row.minimum_payment) || 0, remainingMonths: row.remaining_months || 0, startDate: row.start_date, createdAt: row.created_at, updatedAt: row.updated_at }
}
function mapRecurringFromDB(row: any): RecurringTransaction {
  return { id: row.id, userId: row.user_id, name: row.name, type: row.type, amount: parseFloat(row.amount) || 0, category: row.category, frequency: row.frequency, startDate: row.start_date, nextDate: row.next_date, isActive: row.is_active, createdAt: row.created_at, updatedAt: row.updated_at }
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  accounts: [], transactions: [], debts: [], recurring: [], isLoading: false,
  syncStatus: { status: 'synced', pendingCount: 0, lastSynced: null, error: null },
  setSyncStatus: (syncStatus) => set({ syncStatus }),

  loadUserData: async (userId: string, isCloudAuth: boolean) => {
    set({ isLoading: true })
    try {
      if (isCloudAuth && supabase && isOnline()) {
        console.log('[FinanceStore] Loading from Supabase...')
        const [accountsRes, transactionsRes, debtsRes, recurringRes] = await Promise.all([
          supabase.from('accounts').select('*').eq('user_id', userId),
          supabase.from('transactions').select('*').eq('user_id', userId),
          supabase.from('debts').select('*').eq('user_id', userId),
          supabase.from('recurring_transactions').select('*').eq('user_id', userId),
        ])
        const accounts = (accountsRes.data || []).map(mapAccountFromDB)
        const transactions = (transactionsRes.data || []).map(mapTransactionFromDB)
        const debts = (debtsRes.data || []).map(mapDebtFromDB)
        const recurring = (recurringRes.data || []).map(mapRecurringFromDB)
        transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        console.log('[FinanceStore] Loaded:', { accounts: accounts.length, transactions: transactions.length, debts: debts.length, recurring: recurring.length })
        set({ accounts, transactions, debts, recurring, isLoading: false })
      } else {
        console.log('[FinanceStore] Loading from local IndexedDB...')
        const numericUserId = parseInt(userId)
        const [accounts, transactions, debts, recurring] = await Promise.all([
          getAllByUserId('accounts', numericUserId), getAllByUserId('transactions', numericUserId),
          getAllByUserId('debts', numericUserId), getAllByUserId('recurring', numericUserId),
        ])
        transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        set({ accounts, transactions, debts, recurring, isLoading: false })
      }
    } catch (error) { console.error('Failed to load user data:', error); set({ isLoading: false }) }
  },

  addAccount: async (account, userId, isCloudAuth) => {
    if (isCloudAuth && supabase) {
      const { data, error } = await supabase.from('accounts').insert({ user_id: userId, name: account.name, type: account.type, balance: account.balance }).select().single()
      if (error) { console.error('Failed to add account:', error); return }
      if (data) set((state) => ({ accounts: [...state.accounts, mapAccountFromDB(data)] }))
    } else {
      const id = await addItem('accounts', { ...account, userId: parseInt(userId) })
      const newAccount = await getItem('accounts', id)
      if (newAccount) set((state) => ({ accounts: [...state.accounts, newAccount] }))
    }
  },
  updateAccount: async (account, userId, isCloudAuth) => {
    if (isCloudAuth && supabase) {
      const { error } = await supabase.from('accounts').update({ name: account.name, type: account.type, balance: account.balance }).eq('id', account.id)
      if (error) { console.error('Failed to update account:', error); return }
    } else { await updateItem('accounts', account) }
    set((state) => ({ accounts: state.accounts.map((a) => (a.id === account.id ? account : a)) }))
  },
  deleteAccount: async (id, userId, isCloudAuth) => {
    if (isCloudAuth && supabase) {
      const { error } = await supabase.from('accounts').delete().eq('id', id)
      if (error) { console.error('Failed to delete account:', error); return }
    } else { await deleteItem('accounts', id as number) }
    set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) }))
  },

  addTransaction: async (transaction, userId, isCloudAuth) => {
    if (isCloudAuth && supabase) {
      const { data, error } = await supabase.from('transactions').insert({ user_id: userId, account_id: transaction.accountId || null, type: transaction.type, description: transaction.description, amount: transaction.amount, category: transaction.category, date: transaction.date, notes: transaction.notes || null }).select().single()
      if (error) { console.error('Failed to add transaction:', error); return }
      if (data) set((state) => ({ transactions: [mapTransactionFromDB(data), ...state.transactions] }))
    } else {
      const id = await addItem('transactions', { ...transaction, userId: parseInt(userId) })
      const newTx = await getItem('transactions', id)
      if (newTx) set((state) => ({ transactions: [newTx, ...state.transactions] }))
    }
  },
  updateTransaction: async (transaction, userId, isCloudAuth) => {
    if (isCloudAuth && supabase) {
      const { error } = await supabase.from('transactions').update({ account_id: transaction.accountId || null, type: transaction.type, description: transaction.description, amount: transaction.amount, category: transaction.category, date: transaction.date, notes: transaction.notes || null }).eq('id', transaction.id)
      if (error) { console.error('Failed to update transaction:', error); return }
    } else { await updateItem('transactions', transaction) }
    set((state) => ({ transactions: state.transactions.map((t) => (t.id === transaction.id ? transaction : t)) }))
  },
  deleteTransaction: async (id, userId, isCloudAuth) => {
    if (isCloudAuth && supabase) {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) { console.error('Failed to delete transaction:', error); return }
    } else { await deleteItem('transactions', id as number) }
    set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) }))
  },

  addDebt: async (debt, userId, isCloudAuth) => {
    if (isCloudAuth && supabase) {
      const { data, error } = await supabase.from('debts').insert({ user_id: userId, name: debt.name, type: debt.type, original_balance: debt.originalBalance, current_balance: debt.currentBalance, interest_rate: debt.interestRate, minimum_payment: debt.minimumPayment, remaining_months: debt.remainingMonths, start_date: debt.startDate }).select().single()
      if (error) { console.error('Failed to add debt:', error); return }
      if (data) set((state) => ({ debts: [...state.debts, mapDebtFromDB(data)] }))
    } else {
      const id = await addItem('debts', { ...debt, userId: parseInt(userId) })
      const newDebt = await getItem('debts', id)
      if (newDebt) set((state) => ({ debts: [...state.debts, newDebt] }))
    }
  },
  updateDebt: async (debt, userId, isCloudAuth) => {
    if (isCloudAuth && supabase) {
      const { error } = await supabase.from('debts').update({ name: debt.name, type: debt.type, original_balance: debt.originalBalance, current_balance: debt.currentBalance, interest_rate: debt.interestRate, minimum_payment: debt.minimumPayment, remaining_months: debt.remainingMonths, start_date: debt.startDate }).eq('id', debt.id)
      if (error) { console.error('Failed to update debt:', error); return }
    } else { await updateItem('debts', debt) }
    set((state) => ({ debts: state.debts.map((d) => (d.id === debt.id ? debt : d)) }))
  },
  deleteDebt: async (id, userId, isCloudAuth) => {
    if (isCloudAuth && supabase) {
      const { error } = await supabase.from('debts').delete().eq('id', id)
      if (error) { console.error('Failed to delete debt:', error); return }
    } else { await deleteItem('debts', id as number) }
    set((state) => ({ debts: state.debts.filter((d) => d.id !== id) }))
  },

  addRecurring: async (recurring, userId, isCloudAuth) => {
    if (isCloudAuth && supabase) {
      const { data, error } = await supabase.from('recurring_transactions').insert({ user_id: userId, name: recurring.name, type: recurring.type, amount: recurring.amount, category: recurring.category, frequency: recurring.frequency, start_date: recurring.startDate, next_date: recurring.nextDate, is_active: recurring.isActive }).select().single()
      if (error) { console.error('Failed to add recurring:', error); return }
      if (data) set((state) => ({ recurring: [...state.recurring, mapRecurringFromDB(data)] }))
    } else {
      const id = await addItem('recurring', { ...recurring, userId: parseInt(userId) })
      const newRec = await getItem('recurring', id)
      if (newRec) set((state) => ({ recurring: [...state.recurring, newRec] }))
    }
  },
  updateRecurring: async (recurring, userId, isCloudAuth) => {
    if (isCloudAuth && supabase) {
      const { error } = await supabase.from('recurring_transactions').update({ name: recurring.name, type: recurring.type, amount: recurring.amount, category: recurring.category, frequency: recurring.frequency, start_date: recurring.startDate, next_date: recurring.nextDate, is_active: recurring.isActive }).eq('id', recurring.id)
      if (error) { console.error('Failed to update recurring:', error); return }
    } else { await updateItem('recurring', recurring) }
    set((state) => ({ recurring: state.recurring.map((r) => (r.id === recurring.id ? recurring : r)) }))
  },
  deleteRecurring: async (id, userId, isCloudAuth) => {
    if (isCloudAuth && supabase) {
      const { error } = await supabase.from('recurring_transactions').delete().eq('id', id)
      if (error) { console.error('Failed to delete recurring:', error); return }
    } else { await deleteItem('recurring', id as number) }
    set((state) => ({ recurring: state.recurring.filter((r) => r.id !== id) }))
  },

  getTotalBalance: () => get().accounts.reduce((sum, a) => sum + (a.balance || 0), 0),
  getTotalDebt: () => get().debts.reduce((sum, d) => sum + (d.currentBalance || 0), 0),
  getNetWorth: () => get().getTotalBalance() - get().getTotalDebt(),
  getMonthlyIncome: () => get().recurring.filter((r) => r.type === 'income' && r.frequency === 'monthly' && r.isActive).reduce((sum, r) => sum + (r.amount || 0), 0),
  getMonthlyExpenses: () => get().recurring.filter((r) => r.type === 'expense' && r.frequency === 'monthly' && r.isActive).reduce((sum, r) => sum + (r.amount || 0), 0),
}))

subscribeSyncStatus((status) => { useFinanceStore.getState().setSyncStatus(status) })

// User types
export interface User {
  id?: number;
  username: string;
  password: string;
  createdAt?: string;
  updatedAt?: string;
}

// Account types
export type AccountType = 'checking' | 'savings' | 'credit' | 'cash' | 'investment';

export interface Account {
  id?: number;
  cloudId?: string; // Supabase UUID for cloud sync
  userId: number;
  name: string;
  type: AccountType;
  balance: number;
  createdAt?: string;
  updatedAt?: string;
}

// Transaction types
export type TransactionType = 'income' | 'expense' | 'transfer';

export type Category = 
  | 'Food' | 'Transport' | 'Utilities' | 'Entertainment' 
  | 'Shopping' | 'Health' | 'Housing' | 'Insurance'
  | 'Income' | 'Investment' | 'Other';

export interface Transaction {
  id?: number;
  cloudId?: string; // Supabase UUID for cloud sync
  userId: number;
  accountId?: number;
  type: TransactionType;
  description: string;
  amount: number;
  category: Category;
  date: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Debt types
export type DebtType = 
  | 'mortgage' | 'auto' | 'student' | 'personal' 
  | 'credit_card' | 'medical' | 'other';

export interface Debt {
  id?: number;
  cloudId?: string; // Supabase UUID for cloud sync
  userId: number;
  name: string;
  type: DebtType;
  originalBalance: number;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
  remainingMonths: number;
  startDate: string;
  createdAt?: string;
  updatedAt?: string;
}

// Recurring transaction types
export type Frequency = 
  | 'daily' | 'weekly' | 'biweekly' 
  | 'monthly' | 'quarterly' | 'annually';

export interface RecurringTransaction {
  id?: number;
  cloudId?: string; // Supabase UUID for cloud sync
  userId: number;
  name: string;
  type: TransactionType;
  amount: number;
  category: Category;
  frequency: Frequency;
  startDate: string;
  nextDate: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Amortization types
export interface AmortizationPayment {
  month: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalInterest: number;
  totalPrincipal: number;
}

export interface AmortizationSchedule {
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
  schedule: AmortizationPayment[];
}

// Forecast types
export interface ForecastMonth {
  month: string;
  monthName: string;
  projectedBalance: number;
  income: number;
  expenses: number;
  netChange: number;
}

export interface SpendingTrends {
  categoryTotals: Record<string, number>;
  monthlyTotals: Record<string, { income: number; expenses: number; categories: Record<string, number> }>;
  avgMonthlyExpense: number;
  avgMonthlyIncome: number;
  avgMonthlySavings: number;
  expenseTrend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
}

// Sync status for UI
export interface SyncStatus {
  status: 'synced' | 'syncing' | 'offline' | 'error';
  pendingCount: number;
  lastSynced: string | null;
  error: string | null;
}

# API Reference

This document describes the internal APIs and utility functions available in PixelVault.

## Database Operations (`src/lib/db.ts`)

### Initialization

```typescript
import { getDB } from '@/lib/db'

// Initialize database connection
const db = await getDB()
```

### User Operations

```typescript
import { createUser, verifyUser } from '@/lib/db'

// Create new user
const userId = await createUser('username', 'password')

// Verify user credentials (returns User or null)
const user = await verifyUser('username', 'password')
```

### Generic CRUD Operations

```typescript
import { addItem, updateItem, deleteItem, getItem, getAllByUserId } from '@/lib/db'

// Add item to a store
const id = await addItem('accounts', { userId: 1, name: 'Checking', type: 'checking', balance: 1000 })

// Update item
await updateItem('accounts', { id: 1, userId: 1, name: 'Main Checking', type: 'checking', balance: 1500 })

// Delete item
await deleteItem('accounts', 1)

// Get single item
const account = await getItem('accounts', 1)

// Get all items for user
const accounts = await getAllByUserId('accounts', userId)
```

### Available Stores

| Store | Description |
|-------|-------------|
| `users` | User accounts |
| `accounts` | Financial accounts |
| `transactions` | Transaction records |
| `debts` | Debt/loan tracking |
| `recurring` | Recurring transactions |

---

## Amortization Calculator (`src/lib/amortization.ts`)

### Calculate Monthly Payment

```typescript
import { calculateMonthlyPayment } from '@/lib/amortization'

const payment = calculateMonthlyPayment(
  250000,  // principal amount
  6.5,     // annual interest rate (%)
  360      // loan term in months
)
// Returns: 1580.17
```

### Generate Amortization Schedule

```typescript
import { generateAmortizationSchedule } from '@/lib/amortization'

const schedule = generateAmortizationSchedule(
  250000,           // principal
  6.5,              // annual rate (%)
  360,              // term in months
  new Date()        // start date (optional)
)

// Returns:
// {
//   monthlyPayment: 1580.17,
//   totalPayments: 568861.22,
//   totalInterest: 318861.22,
//   schedule: [
//     { month: 1, date: '2026-02-18', payment: 1580.17, principal: 225.17, interest: 1354.17, balance: 249774.83, ... },
//     ...
//   ]
// }
```

### Calculate with Extra Payments

```typescript
import { calculateWithExtraPayments } from '@/lib/amortization'

const result = calculateWithExtraPayments(
  250000,  // principal
  6.5,     // annual rate (%)
  360,     // original term
  200      // extra monthly payment
)

// Returns:
// {
//   monthsToPayoff: 278,
//   originalMonths: 360,
//   monthsSaved: 82,
//   totalInterest: 221543.67,
//   interestSaved: 97317.55,
//   schedule: [...]
// }
```

### Credit Card Payoff Calculator

```typescript
import { calculateCreditCardPayoff } from '@/lib/amortization'

const result = calculateCreditCardPayoff(
  5000,    // balance
  24.99,   // APR (%)
  200      // monthly payment
)

// Returns:
// {
//   monthsToPayoff: 32,
//   totalInterest: 1387.45,
//   totalPayments: 6387.45
// }
// OR { error: 'Payment too low to pay off balance' }
```

### Debt Payoff Strategies

```typescript
import { calculateDebtPayoff } from '@/lib/amortization'

const debts = [
  { name: 'Credit Card', currentBalance: 5000, interestRate: 24.99, minimumPayment: 100 },
  { name: 'Car Loan', currentBalance: 15000, interestRate: 6.5, minimumPayment: 350 },
  { name: 'Student Loan', currentBalance: 25000, interestRate: 5.0, minimumPayment: 250 },
]

// Avalanche method (highest interest first)
const avalanche = calculateDebtPayoff(debts, 100, 'avalanche')

// Snowball method (lowest balance first)  
const snowball = calculateDebtPayoff(debts, 100, 'snowball')

// Returns:
// {
//   totalMonths: 48,
//   totalInterestPaid: 8234.56,
//   payoffOrder: [
//     { name: 'Credit Card', payoffMonth: 18 },
//     { name: 'Car Loan', payoffMonth: 32 },
//     { name: 'Student Loan', payoffMonth: 48 }
//   ]
// }
```

---

## Utility Functions (`src/lib/utils.ts`)

### Class Name Utility

```typescript
import { cn } from '@/lib/utils'

// Merge Tailwind classes conditionally
<div className={cn('base-class', isActive && 'active-class', className)} />
```

### Formatting Functions

```typescript
import { formatCurrency, formatDate, formatCompactNumber } from '@/lib/utils'

formatCurrency(1234.56)      // "$1,234.56"
formatDate('2026-01-18')     // "Jan 18, 2026"
formatCompactNumber(1500000) // "1.5M"
formatCompactNumber(25000)   // "25.0K"
```

---

## State Management

### Auth Store (`src/stores/authStore.ts`)

```typescript
import { useAuthStore } from '@/stores'

function Component() {
  const { user, isLoading, error, login, register, logout, clearError } = useAuthStore()
  
  // Login
  const success = await login('username', 'password')
  
  // Register
  const success = await register('username', 'password')
  
  // Logout
  logout()
  
  // Check auth status
  if (user) {
    console.log(`Logged in as ${user.username}`)
  }
}
```

### Finance Store (`src/stores/financeStore.ts`)

```typescript
import { useFinanceStore } from '@/stores'

function Component() {
  const {
    // Data
    accounts,
    transactions,
    debts,
    recurring,
    isLoading,
    
    // Actions
    loadUserData,
    addAccount, updateAccount, deleteAccount,
    addTransaction, updateTransaction, deleteTransaction,
    addDebt, updateDebt, deleteDebt,
    addRecurring, updateRecurring, deleteRecurring,
    
    // Computed
    getTotalBalance,
    getTotalDebt,
    getNetWorth,
    getMonthlyIncome,
    getMonthlyExpenses,
  } = useFinanceStore()
  
  // Load data on mount
  useEffect(() => {
    loadUserData(userId)
  }, [userId])
  
  // Use computed values
  const netWorth = getNetWorth()
  const cashFlow = getMonthlyIncome() - getMonthlyExpenses()
}
```

---

## Hooks

### useToast (`src/hooks/use-toast.ts`)

```typescript
import { useToast, toast } from '@/hooks/use-toast'

// Inside component
function Component() {
  const { toasts, dismiss } = useToast()
  
  // Show toast
  toast({
    title: 'Success!',
    description: 'Account created successfully',
    variant: 'success'  // 'default' | 'success' | 'destructive'
  })
  
  // Dismiss specific toast
  dismiss(toastId)
  
  // Dismiss all
  dismiss()
}

// Outside component (direct call)
toast({ title: 'Hello!' })
```
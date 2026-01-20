# PixelVault - Budget Tracker

A modern, retro-inspired personal finance management application built with React, TypeScript, and Tailwind CSS.

![PixelVault](https://img.shields.io/badge/version-1.0.0-blue) ![React](https://img.shields.io/badge/React-18.2-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178c6) ![Tailwind](https://img.shields.io/badge/Tailwind-3.3-38bdf8)

## Overview

PixelVault is a comprehensive budget tracking application that helps you manage your finances with features including account management, transaction tracking, debt amortization calculations, recurring payment schedules, and financial forecasting.

## Features

- **Dashboard** - At-a-glance view of net worth, balances, cash flow, and recent transactions
- **Account Management** - Track checking, savings, credit, cash, and investment accounts
- **Transaction Tracking** - Log income and expenses with categories and filtering
- **Debt Tracking** - Monitor loans with amortization schedules and payoff progress
- **Recurring Transactions** - Manage subscriptions and scheduled payments
- **Financial Forecasting** - 12-month balance projections and spending analysis

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Vite](https://vitejs.dev/) | Build tool and dev server |
| [React 18](https://react.dev/) | UI framework |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com/) | Accessible component library |
| [Zustand](https://zustand-demo.pmnd.rs/) | State management |
| [Recharts](https://recharts.org/) | Data visualization |
| [IndexedDB (idb)](https://github.com/jakearchibald/idb) | Local data persistence |
| [Lucide React](https://lucide.dev/) | Icon library |
| [date-fns](https://date-fns.org/) | Date utilities |

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone or navigate to project directory
cd G:\budget-tracker

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Default URLs

- Development: http://localhost:5173
- Preview: http://localhost:4173

## Project Structure

```
budget-tracker/
├── public/
│   └── vault.svg              # App icon
├── src/
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── select.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── badge.tsx
│   │   │   └── index.ts
│   │   ├── Layout.tsx         # Main app layout with navigation
│   │   └── StatCard.tsx       # Reusable stat display component
│   ├── hooks/
│   │   └── use-toast.ts       # Toast notification hook
│   ├── lib/
│   │   ├── amortization.ts    # Loan calculation utilities
│   │   ├── db.ts              # IndexedDB database layer
│   │   └── utils.ts           # Helper functions (cn, formatCurrency, etc.)
│   ├── pages/
│   │   ├── AccountsPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── DebtsPage.tsx
│   │   ├── ForecastPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RecurringPage.tsx
│   │   ├── TransactionsPage.tsx
│   │   └── index.ts
│   ├── stores/
│   │   ├── authStore.ts       # Authentication state
│   │   ├── financeStore.ts    # Financial data state
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── App.tsx                # Root component with routing
│   ├── main.tsx               # Entry point
│   ├── index.css              # Global styles and Tailwind config
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tailwind.config.cjs
├── postcss.config.cjs
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Usage Guide

### Authentication

1. On first launch, click **"Sign up"** to create an account
2. Enter a username and password (min 4 characters)
3. Passwords are hashed using SHA-256 before storage

### Managing Accounts

1. Navigate to **Accounts** tab
2. Click **+ Add Account** to create a new account
3. Select account type (Checking, Savings, Credit, Cash, Investment)
4. Enter starting balance
5. Click on any account to edit or delete

### Recording Transactions

1. Navigate to **Transactions** tab
2. Click **+ Add** to record a new transaction
3. Select type (Income/Expense), enter description and amount
4. Choose a category and date
5. Use filter tabs to view All/Income/Expenses

### Tracking Debts

1. Navigate to **Debts** tab
2. Click **+ Add Debt** to add a loan or credit card
3. Enter loan details:
   - Original and current balance
   - Interest rate (APR)
   - Minimum payment
   - Remaining months
4. View amortization details including:
   - Monthly payment calculation
   - Total interest
   - Payoff progress

### Setting Up Recurring Items

1. Navigate to **Recurring** tab
2. Click **+ Add** to create a recurring transaction
3. Set frequency (Daily, Weekly, Bi-Weekly, Monthly, Quarterly, Annually)
4. Enter amount and category
5. Recurring items are used for cash flow forecasting

### Viewing Forecasts

1. Navigate to **Forecast** tab
2. View projected balances at 1, 3, 6, and 12 months
3. See balance projection chart
4. Review monthly cash flow breakdown
5. Analyze expense categories

## Data Storage

All data is stored locally in your browser using IndexedDB:

- **Users** - Authentication credentials (hashed)
- **Accounts** - Financial accounts and balances
- **Transactions** - Income and expense records
- **Debts** - Loan and credit card details
- **Recurring** - Scheduled transactions

Data persists across browser sessions but is local to your device/browser.

## Amortization Calculations

The app includes comprehensive loan calculation utilities:

```typescript
// Calculate monthly payment
calculateMonthlyPayment(principal, annualRate, termMonths)

// Generate full amortization schedule
generateAmortizationSchedule(principal, annualRate, termMonths, startDate)

// Calculate with extra payments
calculateWithExtraPayments(principal, annualRate, termMonths, extraMonthly)

// Credit card payoff calculator
calculateCreditCardPayoff(balance, apr, monthlyPayment)

// Debt snowball/avalanche comparison
calculateDebtPayoff(debts, extraPayment, method)
```

## Configuration

### Tailwind Theme

The app uses a custom dark theme with retro-inspired colors defined in `tailwind.config.cjs`:

```javascript
colors: {
  neon: {
    cyan: "#00d4ff",
    green: "#39ff14",
    pink: "#ff6ec7",
    yellow: "#f4d03f",
    orange: "#ff6b35",
  },
  retro: {
    dark: "#0a0a0f",
    darker: "#050508",
    panel: "#12121a",
    border: "#2a2a3a",
  },
}
```

### CSS Variables

Theme colors are defined as CSS variables in `src/index.css` using HSL format for easy customization.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

Requires IndexedDB support for data persistence.

## Future Enhancements

- [ ] Google Drive sync for cloud backup
- [ ] Data export (CSV, PDF)
- [ ] Budget goals and alerts
- [ ] Multiple currency support
- [ ] Dark/Light theme toggle
- [ ] Mobile app (PWA)
- [ ] Bank API integration
- [ ] Receipt scanning

## License

MIT License - feel free to use and modify for personal or commercial projects.

---

Built with ❤️ using React + TypeScript + Tailwind CSS
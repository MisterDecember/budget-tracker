# Quick Start Guide

Get up and running with PixelVault in 5 minutes.

## 1. Install Dependencies

```bash
cd G:\budget-tracker
npm install
```

## 2. Start Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## 3. Create Your Account

1. Enter a username (e.g., "demo")
2. Enter a password (minimum 4 characters)
3. Click **Create Account**

## 4. Set Up Your Accounts

1. Click **Accounts** in the navigation
2. Click **+ Add Account**
3. Fill in:
   - **Name**: e.g., "Main Checking"
   - **Type**: Checking
   - **Balance**: Your current balance
4. Click **Add**
5. Repeat for Savings, Credit Cards, etc.

## 5. Add Recurring Transactions

1. Click **Recurring** in the navigation
2. Click **+ Add**
3. Add your regular income:
   - **Name**: "Salary"
   - **Type**: Income
   - **Frequency**: Monthly
   - **Amount**: Your monthly income
4. Add your regular expenses:
   - Rent/Mortgage
   - Utilities
   - Subscriptions (Netflix, Spotify, etc.)
   - Insurance

## 6. Track Your Debts

1. Click **Debts** in the navigation
2. Click **+ Add Debt**
3. Fill in your loan details:
   - **Name**: "Car Loan"
   - **Type**: Auto
   - **Original Balance**: Starting loan amount
   - **Current Balance**: What you owe now
   - **APR %**: Interest rate
   - **Minimum Payment**: Monthly payment
   - **Months Left**: Remaining term

## 7. Record Transactions

1. Click **Transactions** in the navigation
2. Click **+ Add**
3. Record your purchases and income as they occur
4. Use categories for better tracking

## 8. Check Your Forecast

1. Click **Forecast** in the navigation
2. View your projected balance over 12 months
3. See your expense breakdown by category

## Tips for Success

### Daily
- Log transactions as they happen (or at end of day)

### Weekly  
- Review recent transactions
- Check account balances are accurate

### Monthly
- Update account balances
- Review spending by category
- Check debt progress

### Quarterly
- Review forecast accuracy
- Adjust recurring items if needed
- Set new savings goals

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Navigate back | `Alt + ←` |
| Refresh data | `Ctrl + R` |
| Close modal | `Esc` |

## Troubleshooting

### Blank Screen
- Open DevTools (F12) → Console for errors
- Try hard refresh: `Ctrl + Shift + R`

### Data Not Saving
- Check browser allows IndexedDB
- Ensure not in incognito/private mode

### Slow Performance
- Clear old transactions (future feature)
- Try a different browser

## Need Help?

Check the full documentation:
- [README.md](../README.md) - Full feature overview
- [API.md](./API.md) - Developer reference
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical design
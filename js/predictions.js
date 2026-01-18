// ============================================
// PIXELVAULT - Predictions & Forecasting Module
// ============================================

const Predictions = {
    // Calculate cash flow forecast
    async forecastCashFlow(userId, months = 12) {
        const accounts = await db.getUserAccounts(userId);
        const recurring = await db.getUserRecurring(userId);
        const transactions = await db.getUserTransactions(userId);

        let currentBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
        const forecast = [];
        const today = new Date();

        for (let m = 0; m < months; m++) {
            const targetDate = new Date(today);
            targetDate.setMonth(targetDate.getMonth() + m);
            const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
            const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

            let income = 0;
            let expenses = 0;

            // Add recurring transactions
            for (const rec of recurring) {
                const amount = this.getRecurringAmountForMonth(rec, monthStart);
                if (rec.type === 'income') {
                    income += amount;
                } else {
                    expenses += amount;
                }
            }

            const netChange = income - expenses;
            currentBalance += netChange;

            forecast.push({
                month: monthStart.toISOString().slice(0, 7),
                monthName: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                projectedBalance: currentBalance,
                income,
                expenses,
                netChange
            });
        }

        return forecast;
    },

    // Get recurring amount for a specific month
    getRecurringAmountForMonth(recurring, monthStart) {
        const freq = recurring.frequency;
        let occurrences = 1;

        switch (freq) {
            case 'daily':
                occurrences = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
                break;
            case 'weekly':
                occurrences = 4;
                break;
            case 'biweekly':
                occurrences = 2;
                break;
            case 'monthly':
                occurrences = 1;
                break;
            case 'quarterly':
                const quarterMonths = [0, 3, 6, 9];
                occurrences = quarterMonths.includes(monthStart.getMonth()) ? 1 : 0;
                break;
            case 'annually':
                const startDate = new Date(recurring.startDate);
                occurrences = monthStart.getMonth() === startDate.getMonth() ? 1 : 0;
                break;
        }

        return recurring.amount * occurrences;
    },

    // Analyze spending trends
    async analyzeSpendingTrends(userId, months = 6) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const transactions = await db.getTransactionsByDateRange(userId, startDate, endDate);
        
        // Group by category
        const categoryTotals = {};
        const monthlyTotals = {};

        for (const t of transactions) {
            if (t.type === 'expense') {
                const category = t.category || 'Other';
                const month = t.date.slice(0, 7);

                categoryTotals[category] = (categoryTotals[category] || 0) + t.amount;
                
                if (!monthlyTotals[month]) {
                    monthlyTotals[month] = { income: 0, expenses: 0, categories: {} };
                }
                monthlyTotals[month].expenses += t.amount;
                monthlyTotals[month].categories[category] = 
                    (monthlyTotals[month].categories[category] || 0) + t.amount;
            } else if (t.type === 'income') {
                const month = t.date.slice(0, 7);
                if (!monthlyTotals[month]) {
                    monthlyTotals[month] = { income: 0, expenses: 0, categories: {} };
                }
                monthlyTotals[month].income += t.amount;
            }
        }

        // Calculate averages and trends
        const sortedMonths = Object.keys(monthlyTotals).sort();
        const avgMonthlyExpense = Object.values(monthlyTotals)
            .reduce((sum, m) => sum + m.expenses, 0) / sortedMonths.length;
        const avgMonthlyIncome = Object.values(monthlyTotals)
            .reduce((sum, m) => sum + m.income, 0) / sortedMonths.length;

        // Calculate trend (simple linear regression)
        const expenseTrend = this.calculateTrend(
            sortedMonths.map((_, i) => i),
            sortedMonths.map(m => monthlyTotals[m].expenses)
        );

        return {
            categoryTotals,
            monthlyTotals,
            avgMonthlyExpense,
            avgMonthlyIncome,
            avgMonthlySavings: avgMonthlyIncome - avgMonthlyExpense,
            expenseTrend: expenseTrend > 0 ? 'increasing' : expenseTrend < 0 ? 'decreasing' : 'stable',
            trendPercentage: (expenseTrend / avgMonthlyExpense) * 100
        };
    },

    // Simple linear regression for trend calculation
    calculateTrend(x, y) {
        const n = x.length;
        if (n < 2) return 0;

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
        const sumXX = x.reduce((total, xi) => total + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return slope;
    },

    // Debt payoff timeline
    async calculateDebtTimeline(userId) {
        const debts = await db.getUserDebts(userId);
        if (debts.length === 0) return null;

        const debtData = debts.map(d => ({
            name: d.name,
            currentBalance: d.currentBalance,
            interestRate: d.interestRate,
            minimumPayment: d.minimumPayment
        }));

        const avalanche = AmortizationCalculator.calculateDebtPayoff(debtData, 0, 'avalanche');
        const snowball = AmortizationCalculator.calculateDebtPayoff(debtData, 0, 'snowball');

        // Calculate with extra $100/month
        const avalancheExtra = AmortizationCalculator.calculateDebtPayoff(debtData, 100, 'avalanche');
        const snowballExtra = AmortizationCalculator.calculateDebtPayoff(debtData, 100, 'snowball');

        return {
            avalanche,
            snowball,
            avalancheExtra,
            snowballExtra,
            recommendation: avalanche.totalInterestPaid < snowball.totalInterestPaid 
                ? 'avalanche' : 'snowball'
        };
    },

    // Project future balance
    async projectBalance(userId, targetDate) {
        const forecast = await this.forecastCashFlow(userId, 24);
        const targetMonth = targetDate.toISOString().slice(0, 7);
        
        const projection = forecast.find(f => f.month === targetMonth);
        if (projection) {
            return projection;
        }

        // If beyond forecast range, extrapolate
        const lastMonth = forecast[forecast.length - 1];
        const avgNetChange = forecast.reduce((sum, f) => sum + f.netChange, 0) / forecast.length;
        const monthsDiff = this.monthsBetween(new Date(lastMonth.month), targetDate);

        return {
            month: targetMonth,
            projectedBalance: lastMonth.projectedBalance + (avgNetChange * monthsDiff),
            isExtrapolated: true
        };
    },

    monthsBetween(date1, date2) {
        return (date2.getFullYear() - date1.getFullYear()) * 12 
            + (date2.getMonth() - date1.getMonth());
    },

    // Savings goal calculator
    calculateSavingsGoal(targetAmount, currentSavings, monthlyContribution, annualReturn = 0) {
        if (monthlyContribution <= 0) return { error: 'Monthly contribution must be positive' };

        let balance = currentSavings;
        const monthlyRate = annualReturn / 100 / 12;
        let months = 0;
        const schedule = [];

        while (balance < targetAmount && months < 600) {
            months++;
            const interest = balance * monthlyRate;
            balance += monthlyContribution + interest;

            if (months % 12 === 0 || balance >= targetAmount) {
                schedule.push({
                    month: months,
                    balance,
                    contributed: currentSavings + (monthlyContribution * months),
                    interest: balance - currentSavings - (monthlyContribution * months)
                });
            }
        }

        return {
            monthsToGoal: months,
            yearsToGoal: (months / 12).toFixed(1),
            totalContributed: currentSavings + (monthlyContribution * months),
            totalInterest: balance - currentSavings - (monthlyContribution * months),
            finalBalance: balance,
            schedule
        };
    }
};

window.Predictions = Predictions;

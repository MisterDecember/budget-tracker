// ============================================
// PIXELVAULT - Amortization Calculator
// ============================================

const AmortizationCalculator = {
    // Calculate monthly payment for a loan
    calculateMonthlyPayment(principal, annualRate, termMonths) {
        if (annualRate === 0) return principal / termMonths;
        const monthlyRate = annualRate / 100 / 12;
        const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) 
                        / (Math.pow(1 + monthlyRate, termMonths) - 1);
        return payment;
    },

    // Generate full amortization schedule
    generateSchedule(principal, annualRate, termMonths, startDate = new Date()) {
        const schedule = [];
        const monthlyRate = annualRate / 100 / 12;
        const monthlyPayment = this.calculateMonthlyPayment(principal, annualRate, termMonths);
        let balance = principal;
        let totalInterest = 0;
        let totalPrincipal = 0;

        for (let month = 1; month <= termMonths; month++) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            balance -= principalPayment;

            // Handle floating point errors
            if (balance < 0.01) balance = 0;

            totalInterest += interestPayment;
            totalPrincipal += principalPayment;

            const paymentDate = new Date(startDate);
            paymentDate.setMonth(paymentDate.getMonth() + month);

            schedule.push({
                month,
                date: paymentDate.toISOString().split('T')[0],
                payment: monthlyPayment,
                principal: principalPayment,
                interest: interestPayment,
                balance: balance,
                totalInterest: totalInterest,
                totalPrincipal: totalPrincipal
            });
        }

        return {
            monthlyPayment,
            totalPayments: monthlyPayment * termMonths,
            totalInterest,
            schedule
        };
    },

    // Calculate payoff date with extra payments
    calculateWithExtraPayments(principal, annualRate, termMonths, extraMonthly = 0) {
        const schedule = [];
        const monthlyRate = annualRate / 100 / 12;
        const basePayment = this.calculateMonthlyPayment(principal, annualRate, termMonths);
        const actualPayment = basePayment + extraMonthly;
        let balance = principal;
        let month = 0;
        let totalInterest = 0;

        while (balance > 0 && month < termMonths * 2) {
            month++;
            const interestPayment = balance * monthlyRate;
            let principalPayment = actualPayment - interestPayment;
            
            if (principalPayment > balance) {
                principalPayment = balance;
            }
            
            balance -= principalPayment;
            if (balance < 0.01) balance = 0;
            totalInterest += interestPayment;

            schedule.push({
                month,
                payment: interestPayment + principalPayment,
                principal: principalPayment,
                interest: interestPayment,
                balance
            });
        }

        const baseSchedule = this.generateSchedule(principal, annualRate, termMonths);
        
        return {
            monthsToPayoff: month,
            originalMonths: termMonths,
            monthsSaved: termMonths - month,
            totalInterest,
            interestSaved: baseSchedule.totalInterest - totalInterest,
            schedule
        };
    },

    // Credit card payoff calculator
    calculateCreditCardPayoff(balance, apr, monthlyPayment) {
        if (monthlyPayment <= balance * (apr / 100 / 12)) {
            return { error: 'Payment too low to pay off balance' };
        }

        const schedule = [];
        const monthlyRate = apr / 100 / 12;
        let remainingBalance = balance;
        let month = 0;
        let totalInterest = 0;

        while (remainingBalance > 0 && month < 600) {
            month++;
            const interestCharge = remainingBalance * monthlyRate;
            let principalPayment = monthlyPayment - interestCharge;
            
            if (principalPayment > remainingBalance) {
                principalPayment = remainingBalance;
            }

            remainingBalance -= principalPayment;
            if (remainingBalance < 0.01) remainingBalance = 0;
            totalInterest += interestCharge;

            schedule.push({
                month,
                payment: interestCharge + principalPayment,
                principal: principalPayment,
                interest: interestCharge,
                balance: remainingBalance
            });
        }

        return {
            monthsToPayoff: month,
            totalInterest,
            totalPayments: balance + totalInterest,
            schedule
        };
    },

    // Debt snowball/avalanche calculator
    calculateDebtPayoff(debts, extraPayment = 0, method = 'avalanche') {
        // Sort debts by method
        let sortedDebts = [...debts].map(d => ({
            ...d,
            balance: d.currentBalance,
            paidOff: false,
            payoffMonth: 0
        }));

        if (method === 'avalanche') {
            sortedDebts.sort((a, b) => b.interestRate - a.interestRate);
        } else {
            sortedDebts.sort((a, b) => a.balance - b.balance);
        }

        let month = 0;
        let totalInterestPaid = 0;
        let availableExtra = extraPayment;
        const timeline = [];

        while (sortedDebts.some(d => !d.paidOff) && month < 600) {
            month++;
            let monthExtra = availableExtra;

            for (const debt of sortedDebts) {
                if (debt.paidOff) continue;

                const monthlyRate = debt.interestRate / 100 / 12;
                const interest = debt.balance * monthlyRate;
                let payment = debt.minimumPayment + (debt === sortedDebts.find(d => !d.paidOff) ? monthExtra : 0);

                if (payment > debt.balance + interest) {
                    payment = debt.balance + interest;
                }

                const principal = payment - interest;
                debt.balance -= principal;
                totalInterestPaid += interest;

                if (debt.balance <= 0.01) {
                    debt.balance = 0;
                    debt.paidOff = true;
                    debt.payoffMonth = month;
                    // Roll payment to next debt
                    availableExtra += debt.minimumPayment;
                }
            }

            timeline.push({
                month,
                debts: sortedDebts.map(d => ({
                    name: d.name,
                    balance: d.balance,
                    paidOff: d.paidOff
                }))
            });
        }

        return {
            totalMonths: month,
            totalInterestPaid,
            payoffOrder: sortedDebts.map(d => ({
                name: d.name,
                payoffMonth: d.payoffMonth
            })),
            timeline
        };
    }
};

// Export for use in other modules
window.AmortizationCalculator = AmortizationCalculator;

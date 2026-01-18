// PIXELVAULT - Views Module
const Views = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    },
    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    async renderDashboard(userId) {
        const accounts = await db.getUserAccounts(userId);
        const debts = await db.getUserDebts(userId);
        const recurring = await db.getUserRecurring(userId);
        const transactions = await db.getUserTransactions(userId);
        const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
        const totalDebt = debts.reduce((sum, d) => sum + d.currentBalance, 0);
        const netWorth = totalBalance - totalDebt;
        const monthlyIncome = recurring.filter(r => r.type === 'income' && r.frequency === 'monthly').reduce((sum, r) => sum + r.amount, 0);
        const monthlyExpenses = recurring.filter(r => r.type === 'expense' && r.frequency === 'monthly').reduce((sum, r) => sum + r.amount, 0);

        let html = `<div class="dashboard-grid">
            <div class="stat-card pixel-border ${netWorth >= 0 ? 'positive' : 'negative'}">
                <div class="stat-label">NET WORTH</div>
                <div class="stat-value ${netWorth >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(netWorth)}</div>
                <div class="stat-change">Assets: ${this.formatCurrency(totalBalance)} | Debts: ${this.formatCurrency(totalDebt)}</div>
            </div>
            <div class="stat-card pixel-border positive">
                <div class="stat-label">TOTAL BALANCE</div>
                <div class="stat-value positive">${this.formatCurrency(totalBalance)}</div>
                <div class="stat-change">${accounts.length} accounts</div>
            </div>
            <div class="stat-card pixel-border negative">
                <div class="stat-label">TOTAL DEBT</div>
                <div class="stat-value negative">${this.formatCurrency(totalDebt)}</div>
                <div class="stat-change">${debts.length} debts tracked</div>
            </div>
            <div class="stat-card pixel-border info">
                <div class="stat-label">MONTHLY CASH FLOW</div>
                <div class="stat-value ${monthlyIncome - monthlyExpenses >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(monthlyIncome - monthlyExpenses)}</div>
                <div class="stat-change">In: ${this.formatCurrency(monthlyIncome)} | Out: ${this.formatCurrency(monthlyExpenses)}</div>
            </div>
        </div>
        <div class="chart-container pixel-border" style="margin-top:1rem;"><div class="chart-title">CASH FLOW FORECAST</div><div id="forecast-chart" class="pixel-chart"></div></div>
        <div class="chart-container pixel-border" style="margin-top:1rem;"><div class="chart-title">RECENT TRANSACTIONS</div>
            <div class="transactions-list">${transactions.slice(0, 5).map(t => this.renderTransactionItem(t)).join('') || '<div class="empty-state"><div class="empty-state-text">NO TRANSACTIONS YET</div></div>'}</div>
        </div>`;
        document.getElementById('main-content').innerHTML = html;
        const forecast = await Predictions.forecastCashFlow(userId, 6);
        if (forecast.length > 0) {
            PixelCharts.lineChart(document.getElementById('forecast-chart'), forecast.map(f => ({ label: f.monthName, value: f.projectedBalance })), { height: 180 });
        }
    },

    renderTransactionItem(t) {
        const iconClass = t.type === 'income' ? 'income' : t.type === 'expense' ? 'expense' : 'transfer';
        const amountClass = t.type === 'income' ? 'income' : 'expense';
        const icon = t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '~';
        return `<div class="transaction-item pixel-border" data-id="${t.id}">
            <div class="transaction-left"><div class="transaction-icon ${iconClass}">${icon}</div>
                <div class="transaction-details"><h4>${t.description}</h4><p>${this.formatDate(t.date)} - ${t.category || 'Other'}</p></div>
            </div>
            <div class="transaction-amount ${amountClass}">${t.type === 'income' ? '+' : '-'}${this.formatCurrency(t.amount)}</div>
        </div>`;
    },

    async renderAccounts(userId) {
        const accounts = await db.getUserAccounts(userId);
        const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
        const icons = { checking: '&#9878;', savings: '&#9733;', credit: '&#9830;', cash: '&#9679;' };
        
        let accountsHtml = accounts.map(a => {
            const balanceClass = a.balance >= 0 ? 'positive' : 'negative';
            return `<div class="account-item pixel-border" onclick="App.showModal('editAccount', ${a.id})">
                <div class="account-info"><div class="account-icon ${a.type}">${icons[a.type] || '&#9679;'}</div>
                    <div class="account-details"><h3>${a.name}</h3><p>${a.type.toUpperCase()}</p></div>
                </div>
                <div class="account-balance"><div class="amount ${balanceClass}">${this.formatCurrency(a.balance)}</div></div>
            </div>`;
        }).join('');

        document.getElementById('main-content').innerHTML = `
            <div class="view-header"><h2 class="view-title">ACCOUNTS</h2>
                <button class="pixel-btn primary" onclick="App.showModal('addAccount')">+ ADD</button>
            </div>
            <div class="stat-card pixel-border positive" style="margin-bottom:1rem;">
                <div class="stat-label">TOTAL BALANCE</div><div class="stat-value positive">${this.formatCurrency(totalBalance)}</div>
            </div>
            <div class="account-list">${accountsHtml || '<div class="empty-state"><div class="empty-state-text">NO ACCOUNTS YET</div></div>'}</div>`;
    },

    async renderTransactions(userId) {
        const transactions = await db.getUserTransactions(userId);
        document.getElementById('main-content').innerHTML = `
            <div class="view-header"><h2 class="view-title">TRANSACTIONS</h2>
                <button class="pixel-btn primary" onclick="App.showModal('addTransaction')">+ ADD</button>
            </div>
            <div class="filters">
                <button class="filter-btn active" data-filter="all">ALL</button>
                <button class="filter-btn" data-filter="income">INCOME</button>
                <button class="filter-btn" data-filter="expense">EXPENSES</button>
            </div>
            <div class="transactions-list" id="transactions-list">
                ${transactions.map(t => this.renderTransactionItem(t)).join('') || '<div class="empty-state"><div class="empty-state-text">NO TRANSACTIONS</div></div>'}
            </div>`;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.dataset.filter;
                const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);
                document.getElementById('transactions-list').innerHTML = filtered.map(t => this.renderTransactionItem(t)).join('') || '<div class="empty-state"><div class="empty-state-text">NO TRANSACTIONS</div></div>';
                Audio.click();
            });
        });
    },

    async renderDebts(userId) {
        const debts = await db.getUserDebts(userId);
        const totalDebt = debts.reduce((sum, d) => sum + d.currentBalance, 0);
        
        let debtsHtml = debts.map(d => {
            const paidOff = d.originalBalance - d.currentBalance;
            const progress = (paidOff / d.originalBalance) * 100;
            const schedule = AmortizationCalculator.generateSchedule(d.currentBalance, d.interestRate, d.remainingMonths);
            return `<div class="debt-card pixel-border" onclick="App.showModal('debtDetails', ${d.id})">
                <div class="debt-header"><div><div class="debt-name">${d.name}</div><div class="debt-type">${d.type.toUpperCase()} - ${d.interestRate}% APR</div></div>
                    <div class="debt-balance"><div class="amount">${this.formatCurrency(d.currentBalance)}</div><div class="label">REMAINING</div></div>
                </div>
                <div class="debt-progress"><div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
                    <div class="progress-text"><span>${this.formatCurrency(paidOff)} paid</span><span>${progress.toFixed(1)}% complete</span></div>
                </div>
                <div class="debt-details">
                    <div class="debt-detail"><div class="value">${this.formatCurrency(schedule.monthlyPayment)}</div><div class="label">MONTHLY</div></div>
                    <div class="debt-detail"><div class="value">${d.remainingMonths}</div><div class="label">MONTHS LEFT</div></div>
                    <div class="debt-detail"><div class="value">${this.formatCurrency(schedule.totalInterest)}</div><div class="label">INTEREST</div></div>
                </div>
            </div>`;
        }).join('');

        document.getElementById('main-content').innerHTML = `
            <div class="view-header"><h2 class="view-title">DEBTS</h2><button class="pixel-btn primary" onclick="App.showModal('addDebt')">+ ADD</button></div>
            <div class="stat-card pixel-border negative" style="margin-bottom:1rem;"><div class="stat-label">TOTAL DEBT</div><div class="stat-value negative">${this.formatCurrency(totalDebt)}</div></div>
            ${debtsHtml || '<div class="empty-state"><div class="empty-state-text">NO DEBTS TRACKED</div></div>'}`;
    },

    async renderRecurring(userId) {
        const recurring = await db.getUserRecurring(userId);
        const freqLabels = { daily: 'Daily', weekly: 'Weekly', biweekly: 'Bi-Weekly', monthly: 'Monthly', quarterly: 'Quarterly', annually: 'Annually' };
        
        let recurringHtml = recurring.map(r => {
            const amountClass = r.type === 'income' ? 'income' : 'expense';
            const sign = r.type === 'income' ? '+' : '-';
            return `<div class="recurring-item pixel-border" onclick="App.showModal('editRecurring', ${r.id})">
                <div class="recurring-info"><h4>${r.name}</h4><div class="frequency">${freqLabels[r.frequency] || r.frequency}</div><div class="next-date">Next: ${this.formatDate(r.nextDate)}</div></div>
                <div class="recurring-amount"><div class="amount ${amountClass}">${sign}${this.formatCurrency(r.amount)}</div></div>
            </div>`;
        }).join('');

        const monthlyIncome = recurring.filter(r => r.type === 'income' && r.frequency === 'monthly').reduce((s, r) => s + r.amount, 0);
        const monthlyExpenses = recurring.filter(r => r.type === 'expense' && r.frequency === 'monthly').reduce((s, r) => s + r.amount, 0);

        document.getElementById('main-content').innerHTML = `
            <div class="view-header"><h2 class="view-title">RECURRING</h2><button class="pixel-btn primary" onclick="App.showModal('addRecurring')">+ ADD</button></div>
            <div class="dashboard-grid" style="margin-bottom:1rem;">
                <div class="stat-card pixel-border positive"><div class="stat-label">MONTHLY INCOME</div><div class="stat-value positive">${this.formatCurrency(monthlyIncome)}</div></div>
                <div class="stat-card pixel-border negative"><div class="stat-label">MONTHLY EXPENSES</div><div class="stat-value negative">${this.formatCurrency(monthlyExpenses)}</div></div>
            </div>
            ${recurringHtml || '<div class="empty-state"><div class="empty-state-text">NO RECURRING ITEMS</div></div>'}`;
    },

    async renderForecast(userId) {
        const forecast = await Predictions.forecastCashFlow(userId, 12);
        const trends = await Predictions.analyzeSpendingTrends(userId, 6);
        
        const month1 = forecast[0] || { projectedBalance: 0, income: 0, expenses: 0 };
        const month3 = forecast[2] || month1;
        const month6 = forecast[5] || month1;
        const month12 = forecast[11] || month1;

        document.getElementById('main-content').innerHTML = `
            <div class="view-header"><h2 class="view-title">FORECAST</h2></div>
            <div class="forecast-summary">
                <div class="forecast-card pixel-border"><div class="forecast-period">1 MONTH</div><div class="forecast-amount ${month1.projectedBalance >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(month1.projectedBalance)}</div><div class="forecast-breakdown">+${this.formatCurrency(month1.income)} / -${this.formatCurrency(month1.expenses)}</div></div>
                <div class="forecast-card pixel-border"><div class="forecast-period">3 MONTHS</div><div class="forecast-amount ${month3.projectedBalance >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(month3.projectedBalance)}</div></div>
                <div class="forecast-card pixel-border"><div class="forecast-period">6 MONTHS</div><div class="forecast-amount ${month6.projectedBalance >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(month6.projectedBalance)}</div></div>
                <div class="forecast-card pixel-border"><div class="forecast-period">12 MONTHS</div><div class="forecast-amount ${month12.projectedBalance >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(month12.projectedBalance)}</div></div>
            </div>
            <div class="chart-container pixel-border"><div class="chart-title">BALANCE PROJECTION</div><div id="forecast-line-chart" style="height:220px;"></div></div>
            <div class="chart-container pixel-border" style="margin-top:1rem;"><div class="chart-title">SPENDING TRENDS</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                    <div><p style="font-size:0.5rem;color:var(--text-secondary);margin-bottom:0.5rem;">AVG MONTHLY</p><p style="font-size:0.75rem;color:var(--danger);">-${this.formatCurrency(trends.avgMonthlyExpense || 0)}</p></div>
                    <div><p style="font-size:0.5rem;color:var(--text-secondary);margin-bottom:0.5rem;">TREND</p><p style="font-size:0.75rem;color:${trends.expenseTrend === 'increasing' ? 'var(--danger)' : 'var(--success)'}">${(trends.expenseTrend || 'stable').toUpperCase()}</p></div>
                </div>
                <div id="spending-pie" style="margin-top:1rem;"></div>
            </div>`;
        
        if (forecast.length > 0) {
            PixelCharts.lineChart(document.getElementById('forecast-line-chart'), forecast.map(f => ({ label: f.monthName, value: f.projectedBalance })), { height: 200 });
        }
        if (trends.categoryTotals && Object.keys(trends.categoryTotals).length > 0) {
            const pieData = Object.entries(trends.categoryTotals).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6);
            PixelCharts.pieChart(document.getElementById('spending-pie'), pieData);
        }
    }
};
window.Views = Views;

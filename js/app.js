// ============================================
// PIXELVAULT - Main Application
// ============================================

const App = {
    currentUser: null,
    currentView: 'dashboard',

    async init() {
        await db.init();
        
        // Check for saved session
        const savedUser = localStorage.getItem('pixelvault_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showApp();
        } else {
            this.showLogin();
        }

        this.bindEvents();
        this.updateDate();
    },

    showLogin() {
        document.getElementById('loading-screen').classList.add('fade-out');
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
            document.getElementById('login-screen').classList.remove('hidden');
            document.getElementById('app-screen').classList.add('hidden');
        }, 500);
    },

    showApp() {
        document.getElementById('loading-screen').classList.add('fade-out');
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('app-screen').classList.remove('hidden');
            document.getElementById('user-display').textContent = this.currentUser.username.toUpperCase();
            this.navigate('dashboard');
        }, 500);
    },

    bindEvents() {
        // Login
        document.getElementById('btn-login').addEventListener('click', () => this.handleLogin());
        document.getElementById('btn-register').addEventListener('click', () => this.handleRegister());
        document.getElementById('password').addEventListener('keypress', (e) => { if (e.key === 'Enter') this.handleLogin(); });
        document.getElementById('btn-logout').addEventListener('click', () => this.handleLogout());

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.navigate(view);
                Audio.navigate();
            });
        });

        // Modal close on overlay click
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') this.closeModal();
        });
    },

    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            this.showLoginError('ENTER USERNAME AND PASSWORD');
            Audio.error();
            return;
        }

        const user = await db.verifyUser(username, password);
        if (user) {
            this.currentUser = { id: user.id, username: user.username };
            localStorage.setItem('pixelvault_user', JSON.stringify(this.currentUser));
            Audio.success();
            this.showApp();
        } else {
            this.showLoginError('INVALID CREDENTIALS');
            Audio.error();
        }
    },

    async handleRegister() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            this.showLoginError('ENTER USERNAME AND PASSWORD');
            Audio.error();
            return;
        }
        if (password.length < 4) {
            this.showLoginError('PASSWORD TOO SHORT');
            Audio.error();
            return;
        }

        try {
            const userId = await db.createUser(username, password);
            this.currentUser = { id: userId, username };
            localStorage.setItem('pixelvault_user', JSON.stringify(this.currentUser));
            Audio.levelUp();
            this.showToast('ACCOUNT CREATED!', 'success');
            this.showApp();
        } catch (e) {
            this.showLoginError('USERNAME TAKEN');
            Audio.error();
        }
    },

    handleLogout() {
        Audio.click();
        localStorage.removeItem('pixelvault_user');
        this.currentUser = null;
        document.getElementById('app-screen').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    },

    showLoginError(msg) {
        const errEl = document.getElementById('login-error');
        errEl.textContent = msg;
        errEl.classList.remove('hidden');
        setTimeout(() => errEl.classList.add('hidden'), 3000);
    },

    navigate(view) {
        this.currentView = view;
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        switch (view) {
            case 'dashboard': Views.renderDashboard(this.currentUser.id); break;
            case 'accounts': Views.renderAccounts(this.currentUser.id); break;
            case 'transactions': Views.renderTransactions(this.currentUser.id); break;
            case 'debts': Views.renderDebts(this.currentUser.id); break;
            case 'recurring': Views.renderRecurring(this.currentUser.id); break;
            case 'forecast': Views.renderForecast(this.currentUser.id); break;
        }
    },

    updateDate() {
        const dateEl = document.getElementById('current-date');
        if (dateEl) {
            dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        }
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast pixel-border ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    showModal(type, id = null) {
        Audio.modalOpen();
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');
        overlay.classList.remove('hidden');

        switch (type) {
            case 'addAccount': content.innerHTML = this.getAccountForm(); break;
            case 'editAccount': this.loadAccountForm(id); break;
            case 'addTransaction': content.innerHTML = this.getTransactionForm(); break;
            case 'addDebt': content.innerHTML = this.getDebtForm(); break;
            case 'debtDetails': this.loadDebtDetails(id); break;
            case 'addRecurring': content.innerHTML = this.getRecurringForm(); break;
            case 'editRecurring': this.loadRecurringForm(id); break;
        }
    },

    closeModal() {
        Audio.modalClose();
        document.getElementById('modal-overlay').classList.add('hidden');
    },

    getAccountForm(account = null) {
        return `<div class="modal-header"><h3 class="modal-title">${account ? 'EDIT' : 'ADD'} ACCOUNT</h3><button class="modal-close" onclick="App.closeModal()">X</button></div>
            <div class="modal-body">
                <div class="form-group"><label>NAME</label><input type="text" id="acc-name" class="pixel-input" value="${account?.name || ''}" placeholder="Main Checking"></div>
                <div class="form-group"><label>TYPE</label><select id="acc-type" class="pixel-select">
                    <option value="checking" ${account?.type === 'checking' ? 'selected' : ''}>CHECKING</option>
                    <option value="savings" ${account?.type === 'savings' ? 'selected' : ''}>SAVINGS</option>
                    <option value="credit" ${account?.type === 'credit' ? 'selected' : ''}>CREDIT</option>
                    <option value="cash" ${account?.type === 'cash' ? 'selected' : ''}>CASH</option>
                </select></div>
                <div class="form-group"><label>BALANCE</label><input type="number" id="acc-balance" class="pixel-input" step="0.01" value="${account?.balance || 0}"></div>
            </div>
            <div class="modal-footer">
                ${account ? `<button class="pixel-btn danger" onclick="App.deleteAccount(${account.id})">DELETE</button>` : ''}
                <button class="pixel-btn primary" onclick="App.saveAccount(${account?.id || 'null'})">${account ? 'UPDATE' : 'ADD'}</button>
            </div>`;
    },

    async loadAccountForm(id) {
        const account = await db.get('accounts', id);
        document.getElementById('modal-content').innerHTML = this.getAccountForm(account);
    },

    async saveAccount(id) {
        const data = {
            userId: this.currentUser.id,
            name: document.getElementById('acc-name').value.trim(),
            type: document.getElementById('acc-type').value,
            balance: parseFloat(document.getElementById('acc-balance').value) || 0
        };
        if (!data.name) { this.showToast('ENTER ACCOUNT NAME', 'error'); Audio.error(); return; }
        
        if (id) { data.id = id; await db.update('accounts', data); }
        else { await db.add('accounts', data); }
        
        Audio.save();
        this.showToast(id ? 'ACCOUNT UPDATED' : 'ACCOUNT ADDED', 'success');
        this.closeModal();
        this.navigate(this.currentView);
    },

    async deleteAccount(id) {
        if (confirm('Delete this account?')) {
            await db.delete('accounts', id);
            Audio.delete();
            this.showToast('ACCOUNT DELETED', 'warning');
            this.closeModal();
            this.navigate(this.currentView);
        }
    },

    getTransactionForm() {
        return `<div class="modal-header"><h3 class="modal-title">ADD TRANSACTION</h3><button class="modal-close" onclick="App.closeModal()">X</button></div>
            <div class="modal-body">
                <div class="form-group"><label>TYPE</label><select id="txn-type" class="pixel-select">
                    <option value="expense">EXPENSE</option><option value="income">INCOME</option>
                </select></div>
                <div class="form-group"><label>DESCRIPTION</label><input type="text" id="txn-desc" class="pixel-input" placeholder="Grocery shopping"></div>
                <div class="form-group"><label>AMOUNT</label><input type="number" id="txn-amount" class="pixel-input" step="0.01" min="0"></div>
                <div class="form-group"><label>CATEGORY</label><select id="txn-category" class="pixel-select">
                    <option value="Food">FOOD</option><option value="Transport">TRANSPORT</option><option value="Utilities">UTILITIES</option>
                    <option value="Entertainment">ENTERTAINMENT</option><option value="Shopping">SHOPPING</option><option value="Health">HEALTH</option>
                    <option value="Income">INCOME</option><option value="Other">OTHER</option>
                </select></div>
                <div class="form-group"><label>DATE</label><input type="date" id="txn-date" class="pixel-input" value="${new Date().toISOString().split('T')[0]}"></div>
            </div>
            <div class="modal-footer"><button class="pixel-btn primary" onclick="App.saveTransaction()">ADD</button></div>`;
    },

    async saveTransaction() {
        const data = {
            userId: this.currentUser.id,
            type: document.getElementById('txn-type').value,
            description: document.getElementById('txn-desc').value.trim(),
            amount: parseFloat(document.getElementById('txn-amount').value) || 0,
            category: document.getElementById('txn-category').value,
            date: document.getElementById('txn-date').value
        };
        if (!data.description || data.amount <= 0) { this.showToast('FILL ALL FIELDS', 'error'); Audio.error(); return; }
        
        await db.add('transactions', data);
        Audio.coin();
        this.showToast('TRANSACTION ADDED', 'success');
        this.closeModal();
        this.navigate(this.currentView);
    },

    getDebtForm(debt = null) {
        return `<div class="modal-header"><h3 class="modal-title">${debt ? 'EDIT' : 'ADD'} DEBT</h3><button class="modal-close" onclick="App.closeModal()">X</button></div>
            <div class="modal-body">
                <div class="form-group"><label>NAME</label><input type="text" id="debt-name" class="pixel-input" value="${debt?.name || ''}" placeholder="Car Loan"></div>
                <div class="form-group"><label>TYPE</label><select id="debt-type" class="pixel-select">
                    <option value="loan" ${debt?.type === 'loan' ? 'selected' : ''}>LOAN</option>
                    <option value="credit_card" ${debt?.type === 'credit_card' ? 'selected' : ''}>CREDIT CARD</option>
                    <option value="mortgage" ${debt?.type === 'mortgage' ? 'selected' : ''}>MORTGAGE</option>
                    <option value="student" ${debt?.type === 'student' ? 'selected' : ''}>STUDENT LOAN</option>
                    <option value="personal" ${debt?.type === 'personal' ? 'selected' : ''}>PERSONAL</option>
                    <option value="other" ${debt?.type === 'other' ? 'selected' : ''}>OTHER</option>
                </select></div>
                <div class="form-row">
                    <div class="form-group"><label>ORIGINAL AMOUNT</label><input type="number" id="debt-original" class="pixel-input" step="0.01" value="${debt?.originalBalance || ''}"></div>
                    <div class="form-group"><label>CURRENT BALANCE</label><input type="number" id="debt-current" class="pixel-input" step="0.01" value="${debt?.currentBalance || ''}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>INTEREST RATE %</label><input type="number" id="debt-rate" class="pixel-input" step="0.01" value="${debt?.interestRate || ''}"></div>
                    <div class="form-group"><label>MONTHS REMAINING</label><input type="number" id="debt-months" class="pixel-input" value="${debt?.remainingMonths || ''}"></div>
                </div>
                <div class="form-group"><label>MIN PAYMENT</label><input type="number" id="debt-minpay" class="pixel-input" step="0.01" value="${debt?.minimumPayment || ''}"></div>
            </div>
            <div class="modal-footer">
                ${debt ? `<button class="pixel-btn danger" onclick="App.deleteDebt(${debt.id})">DELETE</button>` : ''}
                <button class="pixel-btn primary" onclick="App.saveDebt(${debt?.id || 'null'})">${debt ? 'UPDATE' : 'ADD'}</button>
            </div>`;
    },

    async saveDebt(id) {
        const data = {
            userId: this.currentUser.id,
            name: document.getElementById('debt-name').value.trim(),
            type: document.getElementById('debt-type').value,
            originalBalance: parseFloat(document.getElementById('debt-original').value) || 0,
            currentBalance: parseFloat(document.getElementById('debt-current').value) || 0,
            interestRate: parseFloat(document.getElementById('debt-rate').value) || 0,
            remainingMonths: parseInt(document.getElementById('debt-months').value) || 12,
            minimumPayment: parseFloat(document.getElementById('debt-minpay').value) || 0
        };
        if (!data.name || data.currentBalance <= 0) { this.showToast('FILL REQUIRED FIELDS', 'error'); Audio.error(); return; }
        
        if (id) { data.id = id; await db.update('debts', data); }
        else { await db.add('debts', data); }
        
        Audio.save();
        this.showToast(id ? 'DEBT UPDATED' : 'DEBT ADDED', 'success');
        this.closeModal();
        this.navigate(this.currentView);
    },

    async deleteDebt(id) {
        if (confirm('Delete this debt?')) {
            await db.delete('debts', id);
            Audio.delete();
            this.showToast('DEBT DELETED', 'warning');
            this.closeModal();
            this.navigate(this.currentView);
        }
    },

    async loadDebtDetails(id) {
        const debt = await db.get('debts', id);
        const schedule = AmortizationCalculator.generateSchedule(debt.currentBalance, debt.interestRate, debt.remainingMonths);
        const extraPay = AmortizationCalculator.calculateWithExtraPayments(debt.currentBalance, debt.interestRate, debt.remainingMonths, 100);
        
        let scheduleRows = schedule.schedule.slice(0, 12).map(s => 
            `<tr><td>${s.month}</td><td>$${s.payment.toFixed(2)}</td><td>$${s.principal.toFixed(2)}</td><td>$${s.interest.toFixed(2)}</td><td>$${s.balance.toFixed(2)}</td></tr>`
        ).join('');

        document.getElementById('modal-content').innerHTML = `
            <div class="modal-header"><h3 class="modal-title">${debt.name}</h3><button class="modal-close" onclick="App.closeModal()">X</button></div>
            <div class="modal-body">
                <div class="dashboard-grid" style="margin-bottom:1rem;">
                    <div class="stat-card pixel-border negative"><div class="stat-label">BALANCE</div><div class="stat-value negative">$${debt.currentBalance.toFixed(2)}</div></div>
                    <div class="stat-card pixel-border info"><div class="stat-label">MONTHLY</div><div class="stat-value">$${schedule.monthlyPayment.toFixed(2)}</div></div>
                    <div class="stat-card pixel-border"><div class="stat-label">TOTAL INTEREST</div><div class="stat-value">$${schedule.totalInterest.toFixed(2)}</div></div>
                </div>
                <div style="background:var(--bg-highlight);padding:0.75rem;margin-bottom:1rem;">
                    <p style="font-size:0.5rem;color:var(--accent-gold);margin-bottom:0.5rem;">PAY $100 EXTRA/MONTH:</p>
                    <p style="font-size:0.4rem;color:var(--text-secondary);">Pay off ${extraPay.monthsSaved} months faster, save $${extraPay.interestSaved.toFixed(2)} in interest!</p>
                </div>
                <div class="chart-title">AMORTIZATION SCHEDULE</div>
                <div style="max-height:200px;overflow-y:auto;">
                    <table class="amort-table"><thead><tr><th>#</th><th>PAYMENT</th><th>PRINCIPAL</th><th>INTEREST</th><th>BALANCE</th></tr></thead>
                    <tbody>${scheduleRows}</tbody></table>
                </div>
            </div>
            <div class="modal-footer"><button class="pixel-btn" onclick="App.showModal('addDebt'); App.loadDebtEdit(${id})">EDIT</button></div>`;
    },

    async loadDebtEdit(id) {
        const debt = await db.get('debts', id);
        document.getElementById('modal-content').innerHTML = this.getDebtForm(debt);
    },

    getRecurringForm(recurring = null) {
        const nextDate = recurring?.nextDate || new Date().toISOString().split('T')[0];
        return `<div class="modal-header"><h3 class="modal-title">${recurring ? 'EDIT' : 'ADD'} RECURRING</h3><button class="modal-close" onclick="App.closeModal()">X</button></div>
            <div class="modal-body">
                <div class="form-group"><label>NAME</label><input type="text" id="rec-name" class="pixel-input" value="${recurring?.name || ''}" placeholder="Netflix, Rent, Salary..."></div>
                <div class="form-row">
                    <div class="form-group"><label>TYPE</label><select id="rec-type" class="pixel-select">
                        <option value="expense" ${recurring?.type === 'expense' ? 'selected' : ''}>EXPENSE</option>
                        <option value="income" ${recurring?.type === 'income' ? 'selected' : ''}>INCOME</option>
                    </select></div>
                    <div class="form-group"><label>AMOUNT</label><input type="number" id="rec-amount" class="pixel-input" step="0.01" value="${recurring?.amount || ''}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>FREQUENCY</label><select id="rec-freq" class="pixel-select">
                        <option value="daily" ${recurring?.frequency === 'daily' ? 'selected' : ''}>DAILY</option>
                        <option value="weekly" ${recurring?.frequency === 'weekly' ? 'selected' : ''}>WEEKLY</option>
                        <option value="biweekly" ${recurring?.frequency === 'biweekly' ? 'selected' : ''}>BI-WEEKLY</option>
                        <option value="monthly" ${recurring?.frequency === 'monthly' ? 'selected' : ''}>MONTHLY</option>
                        <option value="quarterly" ${recurring?.frequency === 'quarterly' ? 'selected' : ''}>QUARTERLY</option>
                        <option value="annually" ${recurring?.frequency === 'annually' ? 'selected' : ''}>ANNUALLY</option>
                    </select></div>
                    <div class="form-group"><label>NEXT DATE</label><input type="date" id="rec-next" class="pixel-input" value="${nextDate}"></div>
                </div>
                <div class="form-group"><label>CATEGORY</label><select id="rec-category" class="pixel-select">
                    <option value="Housing" ${recurring?.category === 'Housing' ? 'selected' : ''}>HOUSING</option>
                    <option value="Utilities" ${recurring?.category === 'Utilities' ? 'selected' : ''}>UTILITIES</option>
                    <option value="Insurance" ${recurring?.category === 'Insurance' ? 'selected' : ''}>INSURANCE</option>
                    <option value="Subscriptions" ${recurring?.category === 'Subscriptions' ? 'selected' : ''}>SUBSCRIPTIONS</option>
                    <option value="Income" ${recurring?.category === 'Income' ? 'selected' : ''}>INCOME</option>
                    <option value="Debt" ${recurring?.category === 'Debt' ? 'selected' : ''}>DEBT PAYMENT</option>
                    <option value="Other" ${recurring?.category === 'Other' ? 'selected' : ''}>OTHER</option>
                </select></div>
            </div>
            <div class="modal-footer">
                ${recurring ? `<button class="pixel-btn danger" onclick="App.deleteRecurring(${recurring.id})">DELETE</button>` : ''}
                <button class="pixel-btn primary" onclick="App.saveRecurring(${recurring?.id || 'null'})">${recurring ? 'UPDATE' : 'ADD'}</button>
            </div>`;
    },

    async loadRecurringForm(id) {
        const recurring = await db.get('recurring', id);
        document.getElementById('modal-content').innerHTML = this.getRecurringForm(recurring);
    },

    async saveRecurring(id) {
        const data = {
            userId: this.currentUser.id,
            name: document.getElementById('rec-name').value.trim(),
            type: document.getElementById('rec-type').value,
            amount: parseFloat(document.getElementById('rec-amount').value) || 0,
            frequency: document.getElementById('rec-freq').value,
            nextDate: document.getElementById('rec-next').value,
            category: document.getElementById('rec-category').value
        };
        if (!data.name || data.amount <= 0) { this.showToast('FILL ALL FIELDS', 'error'); Audio.error(); return; }
        
        if (id) { data.id = id; await db.update('recurring', data); }
        else { await db.add('recurring', data); }
        
        Audio.save();
        this.showToast(id ? 'RECURRING UPDATED' : 'RECURRING ADDED', 'success');
        this.closeModal();
        this.navigate(this.currentView);
    },

    async deleteRecurring(id) {
        if (confirm('Delete this recurring item?')) {
            await db.delete('recurring', id);
            Audio.delete();
            this.showToast('RECURRING DELETED', 'warning');
            this.closeModal();
            this.navigate(this.currentView);
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
window.App = App;

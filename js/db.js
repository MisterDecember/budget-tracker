// ============================================
// PIXELVAULT - IndexedDB Database Module
// ============================================

const DB_NAME = 'PixelVaultDB';
const DB_VERSION = 1;

class Database {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Users store
                if (!db.objectStoreNames.contains('users')) {
                    const usersStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
                    usersStore.createIndex('username', 'username', { unique: true });
                }

                // Accounts store (checking, savings, etc.)
                if (!db.objectStoreNames.contains('accounts')) {
                    const accountsStore = db.createObjectStore('accounts', { keyPath: 'id', autoIncrement: true });
                    accountsStore.createIndex('userId', 'userId', { unique: false });
                    accountsStore.createIndex('type', 'type', { unique: false });
                }

                // Transactions store
                if (!db.objectStoreNames.contains('transactions')) {
                    const transStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
                    transStore.createIndex('userId', 'userId', { unique: false });
                    transStore.createIndex('accountId', 'accountId', { unique: false });
                    transStore.createIndex('date', 'date', { unique: false });
                    transStore.createIndex('category', 'category', { unique: false });
                }

                // Debts store (loans, credit cards, mortgages)
                if (!db.objectStoreNames.contains('debts')) {
                    const debtsStore = db.createObjectStore('debts', { keyPath: 'id', autoIncrement: true });
                    debtsStore.createIndex('userId', 'userId', { unique: false });
                    debtsStore.createIndex('type', 'type', { unique: false });
                }

                // Recurring transactions store
                if (!db.objectStoreNames.contains('recurring')) {
                    const recurringStore = db.createObjectStore('recurring', { keyPath: 'id', autoIncrement: true });
                    recurringStore.createIndex('userId', 'userId', { unique: false });
                    recurringStore.createIndex('frequency', 'frequency', { unique: false });
                }
            };
        });
    }

    // Generic CRUD operations
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            data.createdAt = new Date().toISOString();
            data.updatedAt = new Date().toISOString();
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            data.updatedAt = new Date().toISOString();
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getOneByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.get(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

// User-specific database operations
class UserDB extends Database {
    async createUser(username, password) {
        // Simple hash for demo - in production use bcrypt or similar
        const hashedPassword = await this.hashPassword(password);
        return this.add('users', { username, password: hashedPassword });
    }

    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async verifyUser(username, password) {
        const user = await this.getOneByIndex('users', 'username', username);
        if (!user) return null;
        const hashedPassword = await this.hashPassword(password);
        if (user.password === hashedPassword) {
            return user;
        }
        return null;
    }

    async getUserAccounts(userId) {
        return this.getByIndex('accounts', 'userId', userId);
    }

    async getUserTransactions(userId) {
        const transactions = await this.getByIndex('transactions', 'userId', userId);
        return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    async getUserDebts(userId) {
        return this.getByIndex('debts', 'userId', userId);
    }

    async getUserRecurring(userId) {
        return this.getByIndex('recurring', 'userId', userId);
    }

    // Calculate total balance across all accounts
    async getTotalBalance(userId) {
        const accounts = await this.getUserAccounts(userId);
        return accounts.reduce((sum, acc) => sum + acc.balance, 0);
    }

    // Get transactions within date range
    async getTransactionsByDateRange(userId, startDate, endDate) {
        const transactions = await this.getUserTransactions(userId);
        return transactions.filter(t => {
            const date = new Date(t.date);
            return date >= startDate && date <= endDate;
        });
    }
}

// Create global database instance
const db = new UserDB();

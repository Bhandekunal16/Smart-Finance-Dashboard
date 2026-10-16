import { User, Transaction, Budget, TransactionStatistics, PaymentQRCode, ApiResponse } from '../types';

// Initial seed data following api(20261016-094625).md
const DEFAULT_USERS: User[] = [
  {
    name: 'Asha Patel',
    mobile: '9876543210',
    email: 'asha@example.com',
    username: 'asha',
    accounts: [
      {
        type: 'savings',
        bankName: 'Example Bank',
        number: '1234567890',
        balance: 2374.5,
        vpa: 'asha@example',
      },
      {
        type: 'current',
        bankName: 'Metro Commercial Bank',
        number: '987654321012',
        balance: 14500.0,
        vpa: 'asha@metro',
      },
    ],
  },
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    _id: 'txn_1',
    username: 'asha',
    bankName: 'Example Bank',
    type: 'debit',
    transactionAmount: 125.5,
    transactionDesc: 'Groceries & Household Essentials',
    categories: 'food',
    time: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
  },
  {
    _id: 'txn_2',
    username: 'asha',
    bankName: 'Metro Commercial Bank',
    type: 'credit',
    transactionAmount: 5000.0,
    transactionDesc: 'Client Consulting Retainer',
    categories: 'salary',
    time: Date.now() - 1000 * 60 * 60 * 28, // yesterday
  },
  {
    _id: 'txn_3',
    username: 'asha',
    bankName: 'Example Bank',
    type: 'debit',
    transactionAmount: 48.0,
    transactionDesc: 'Electricity & Utility Bill',
    categories: 'bills',
    time: Date.now() - 1000 * 60 * 60 * 72, // 3 days ago
  },
  {
    _id: 'txn_4',
    username: 'asha',
    bankName: 'Example Bank',
    type: 'debit',
    transactionAmount: 85.0,
    transactionDesc: 'Online Book Purchase',
    categories: 'shopping',
    time: Date.now() - 1000 * 60 * 60 * 120, // 5 days ago
  },
  {
    _id: 'txn_5',
    username: 'asha',
    bankName: 'Metro Commercial Bank',
    type: 'credit',
    transactionAmount: 1200.0,
    transactionDesc: 'Quarterly Dividend Deposit',
    categories: 'investment',
    time: Date.now() - 1000 * 60 * 60 * 200, // 8 days ago
  },
];

const DEFAULT_BUDGETS: Budget[] = [
  {
    _id: 'bgt_1',
    username: 'asha',
    amount: 1500,
  },
];

class MockDatabase {
  private users: User[] = [];
  private transactions: Transaction[] = [];
  private budgets: Budget[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const storedUsers = localStorage.getItem('finflow_mock_users');
      const storedTxns = localStorage.getItem('finflow_mock_txns');
      const storedBudgets = localStorage.getItem('finflow_mock_budgets');

      this.users = storedUsers ? JSON.parse(storedUsers) : [...DEFAULT_USERS];
      this.transactions = storedTxns ? JSON.parse(storedTxns) : [...DEFAULT_TRANSACTIONS];
      this.budgets = storedBudgets ? JSON.parse(storedBudgets) : [...DEFAULT_BUDGETS];
    } catch {
      this.users = [...DEFAULT_USERS];
      this.transactions = [...DEFAULT_TRANSACTIONS];
      this.budgets = [...DEFAULT_BUDGETS];
    }
  }

  private persist() {
    try {
      localStorage.setItem('finflow_mock_users', JSON.stringify(this.users));
      localStorage.setItem('finflow_mock_txns', JSON.stringify(this.transactions));
      localStorage.setItem('finflow_mock_budgets', JSON.stringify(this.budgets));
    } catch {
      // ignore
    }
  }

  // GET /
  healthCheck(): ApiResponse<{ message: string }> {
    return {
      message: 'hello world',
      status: true,
      statusCode: 200,
      msg: 'success',
    };
  }

  // POST /create
  createUser(userData: User): ApiResponse<User> {
    const existing = this.users.find(
      (u) =>
        u.username.toLowerCase() === userData.username.toLowerCase() ||
        u.mobile === userData.mobile ||
        u.email.toLowerCase() === userData.email.toLowerCase()
    );

    if (existing) {
      return {
        data: undefined,
        status: true, // Express API bug returns status: true with Conflict
        statusCode: 409,
        msg: 'Conflict: User already exists with username, email, or mobile',
      };
    }

    const newUser: User = {
      ...userData,
      accounts: (userData.accounts || []).map((acc) => ({
        ...acc,
        balance: Number(acc.balance) || 0,
      })),
    };
    this.users.push(newUser);
    this.persist();

    return {
      data: newUser,
      status: true,
      statusCode: 200,
      msg: 'success',
    };
  }

  // POST /get/account
  getAccount(filter: { username?: string; mobile?: string }): ApiResponse<User | null> {
    const user = this.users.find((u) => {
      if (filter.username && u.username.toLowerCase() === filter.username.toLowerCase()) return true;
      if (filter.mobile && u.mobile === filter.mobile) return true;
      return false;
    });

    if (!user) {
      return {
        data: null,
        status: true,
        statusCode: 404,
        msg: 'Not Found',
      };
    }

    return {
      data: user,
      status: true,
      statusCode: 200,
      msg: 'success',
    };
  }

  // POST /create/payment
  createPayment(paymentData: {
    username: string;
    bankName: string;
    type: 'debit' | 'credit';
    transactionAmount: number;
    transactionDesc?: string;
    categories?: string;
    time?: number;
  }): ApiResponse<Transaction> {
    const user = this.users.find((u) => u.username.toLowerCase() === paymentData.username.toLowerCase());
    const amt = Number(paymentData.transactionAmount) || 0;

    if (user) {
      const account = user.accounts.find(
        (a) => a.bankName.toLowerCase() === paymentData.bankName.toLowerCase()
      );
      if (account) {
        if (paymentData.type === 'debit') {
          account.balance = Math.max(0, account.balance - amt);
        } else {
          account.balance += amt;
        }
      }
    }

    const newTxn: Transaction = {
      _id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: paymentData.username,
      bankName: paymentData.bankName,
      type: paymentData.type,
      transactionAmount: amt,
      transactionDesc: paymentData.transactionDesc || (paymentData.type === 'debit' ? 'Expense' : 'Income'),
      categories: paymentData.categories || 'general',
      time: paymentData.time || Date.now(),
    };

    this.transactions.unshift(newTxn);
    this.persist();

    return {
      data: newTxn,
      status: true,
      statusCode: 200,
      msg: 'success',
    };
  }

  // POST /get/txn
  getTxn(filter: { username?: string }): ApiResponse<Transaction[]> {
    let result = [...this.transactions];
    if (filter.username) {
      result = result.filter((t) => t.username.toLowerCase() === filter.username!.toLowerCase());
    }
    result.sort((a, b) => (b.time || 0) - (a.time || 0));

    return {
      data: result,
      status: true,
      statusCode: 200,
      msg: 'success',
    };
  }

  // POST /add/budget
  addBudget(budgetData: { username: string; amount: number }): ApiResponse<Budget> {
    const newBudget: Budget = {
      _id: `bgt_${Date.now()}`,
      username: budgetData.username,
      amount: Number(budgetData.amount) || 0,
    };
    this.budgets.push(newBudget);
    this.persist();

    return {
      data: newBudget,
      status: true,
      statusCode: 200,
      msg: 'success',
    };
  }

  // POST /get/budget
  getBudget(filter: { username?: string }): ApiResponse<Budget[]> {
    let result = [...this.budgets];
    if (filter.username) {
      result = result.filter((b) => b.username.toLowerCase() === filter.username!.toLowerCase());
    }

    return {
      data: result,
      status: true,
      statusCode: 200,
      msg: 'success',
    };
  }

  // POST /update/budget
  updateBudget(data: { username: string; amount: number }): ApiResponse<any> {
    const budget = this.budgets.find(
      (b) => b.username.toLowerCase() === data.username.toLowerCase()
    );
    if (budget) {
      budget.amount = Number(data.amount) || 0;
      this.persist();
      return {
        data: { acknowledged: true, modifiedCount: 1 },
        status: true,
        statusCode: 200,
        msg: 'success',
      };
    }
    return {
      data: null,
      status: true,
      statusCode: 404,
      msg: 'Not Found',
    };
  }

  // POST /get/txn/statistics
  getTxnStatistics(filter: { username?: string }): ApiResponse<TransactionStatistics> {
    let txns = [...this.transactions];
    if (filter.username) {
      txns = txns.filter((t) => t.username.toLowerCase() === filter.username!.toLowerCase());
    }

    let totalCreditCount = 0;
    let totalDebitCount = 0;
    let totalCreditAmount = 0;
    let totalDebitAmount = 0;
    const dateWise: Record<string, Transaction[]> = {};
    const dateSet = new Set<string>();

    for (const txn of txns) {
      if (txn.type === 'debit') {
        totalDebitCount += 1;
        totalDebitAmount += txn.transactionAmount || 0;
      } else {
        totalCreditCount += 1;
        totalCreditAmount += txn.transactionAmount || 0;
      }

      const d = new Date(txn.time);
      const dateStr = d.toDateString();
      dateSet.add(dateStr);
      if (!dateWise[dateStr]) {
        dateWise[dateStr] = [];
      }
      dateWise[dateStr].push(txn);
    }

    return {
      data: {
        totalCreditCount,
        totalDebitCount,
        totalCreditAmount,
        totalDebitAmount,
        date: Array.from(dateSet),
        dateWise,
      },
      status: true,
      statusCode: 200,
      msg: 'success',
    };
  }

  // POST /get/monthly/txn
  getMonthlyTxn(filter: { username?: string }): ApiResponse<number> {
    let txns = [...this.transactions];
    if (filter.username) {
      txns = txns.filter((t) => t.username.toLowerCase() === filter.username!.toLowerCase());
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const monthlyDebitTotal = txns
      .filter((t) => {
        if (t.type !== 'debit') return false;
        const d = new Date(t.time);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((sum, t) => sum + (t.transactionAmount || 0), 0);

    return {
      data: monthlyDebitTotal,
      status: true,
      statusCode: 200,
      msg: 'success',
    };
  }

  // POST /get/qr
  getQr(payload: { username: string; Amount?: number }): ApiResponse<PaymentQRCode[]> {
    const user = this.users.find((u) => u.username.toLowerCase() === payload.username.toLowerCase());
    if (!user || !user.accounts || user.accounts.length === 0) {
      return {
        data: [],
        status: true,
        statusCode: 200,
        msg: 'success',
      };
    }

    const qrs: PaymentQRCode[] = user.accounts.map((acc) => {
      // Generate standard canvas/SVG data URL QR code representation
      const upiUri = `upi://pay?pa=${encodeURIComponent(acc.vpa)}&pn=${encodeURIComponent(user.name)}&cu=INR${
        payload.Amount ? `&am=${encodeURIComponent(payload.Amount)}` : ''
      }`;
      
      // Generate clean visual SVG data URL that renders universally without network calls
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
        <rect width="200" height="200" fill="#ffffff" rx="12"/>
        <rect x="20" y="20" width="48" height="48" fill="#0f172a" rx="6"/>
        <rect x="28" y="28" width="32" height="32" fill="#ffffff" rx="4"/>
        <rect x="36" y="36" width="16" height="16" fill="#0f172a" rx="2"/>
        
        <rect x="132" y="20" width="48" height="48" fill="#0f172a" rx="6"/>
        <rect x="140" y="28" width="32" height="32" fill="#ffffff" rx="4"/>
        <rect x="148" y="36" width="16" height="16" fill="#0f172a" rx="2"/>
        
        <rect x="20" y="132" width="48" height="48" fill="#0f172a" rx="6"/>
        <rect x="28" y="140" width="32" height="32" fill="#ffffff" rx="4"/>
        <rect x="36" y="148" width="16" height="16" fill="#0f172a" rx="2"/>
        
        <!-- QR Matrix data blocks -->
        <rect x="80" y="24" width="12" height="12" fill="#0f172a"/>
        <rect x="104" y="24" width="12" height="24" fill="#0f172a"/>
        <rect x="80" y="48" width="24" height="12" fill="#0f172a"/>
        
        <rect x="24" y="80" width="12" height="24" fill="#0f172a"/>
        <rect x="48" y="80" width="24" height="12" fill="#0f172a"/>
        <rect x="84" y="84" width="32" height="32" fill="#2563eb" rx="4"/>
        <rect x="94" y="94" width="12" height="12" fill="#ffffff" rx="2"/>
        
        <rect x="128" y="80" width="24" height="12" fill="#0f172a"/>
        <rect x="160" y="80" width="16" height="24" fill="#0f172a"/>
        <rect x="128" y="104" width="16" height="16" fill="#0f172a"/>
        
        <rect x="80" y="132" width="24" height="16" fill="#0f172a"/>
        <rect x="112" y="132" width="16" height="32" fill="#0f172a"/>
        <rect x="136" y="144" width="24" height="16" fill="#0f172a"/>
        <rect x="168" y="132" width="12" height="48" fill="#0f172a"/>
        <rect x="80" y="160" width="24" height="20" fill="#0f172a"/>
      </svg>`;
      const base64Svg = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

      return {
        url: base64Svg,
        vpa: acc.vpa,
        bankName: acc.bankName,
      };
    });

    return {
      data: qrs,
      status: true,
      statusCode: 200,
      msg: 'success',
    };
  }

  // GET /send/report/
  sendReport(): ApiResponse<any> {
    return {
      data: {
        timestamp: Date.now(),
        usersReported: this.users.length,
        period: 'Last 30 Days',
        status: 'Delivered',
        recipientSummary: this.users.map((u) => ({
          username: u.username,
          email: u.email,
          accountsCount: u.accounts?.length || 0,
        })),
      },
      status: true,
      statusCode: 200,
      msg: 'success',
    };
  }
}

export const mockDatabase = new MockDatabase();

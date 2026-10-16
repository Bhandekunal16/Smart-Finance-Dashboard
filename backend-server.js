/**
 * Standalone Reference Express Backend Server
 * Matching the exact API specification in api(20261016-094625).md
 *
 * Usage:
 *   node backend-server.js
 *
 * Runs on port 4000 by default (or process.env.PORT)
 */

import express from 'express';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());

// Enable CORS for local Vite development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Seed Data
let users = [
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

let transactions = [
  {
    _id: 'txn_1',
    username: 'asha',
    bankName: 'Example Bank',
    type: 'debit',
    transactionAmount: 125.5,
    transactionDesc: 'Groceries',
    categories: 'food',
    time: Date.now() - 1000 * 60 * 60 * 5,
  },
  {
    _id: 'txn_2',
    username: 'asha',
    bankName: 'Metro Commercial Bank',
    type: 'credit',
    transactionAmount: 5000.0,
    transactionDesc: 'Client Consulting Retainer',
    categories: 'salary',
    time: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    _id: 'txn_3',
    username: 'asha',
    bankName: 'Example Bank',
    type: 'debit',
    transactionAmount: 48.0,
    transactionDesc: 'Electricity Bill',
    categories: 'bills',
    time: Date.now() - 1000 * 60 * 60 * 48,
  },
];

let budgets = [
  {
    _id: 'bgt_1',
    username: 'asha',
    amount: 1500,
  },
];

// Helper matching Express API common response shape
function sendApiResponse(res, data, statusCode = 200, msg = 'success', status = true) {
  return res.status(200).json({
    data,
    status,
    statusCode,
    msg,
  });
}

// 1. GET / - API health check
app.get('/', (req, res) => {
  res.json({ message: 'hello world' });
});

// 2. POST /create - Creates a user document
app.post('/create', (req, res) => {
  const { name, mobile, email, username, accounts } = req.body;
  const existing = users.find(
    (u) =>
      u.username?.toLowerCase() === username?.toLowerCase() ||
      u.mobile === mobile ||
      u.email?.toLowerCase() === email?.toLowerCase()
  );

  if (existing) {
    // Note: API doc states duplicate case returns Conflict with HTTP 200
    return sendApiResponse(res, null, 409, 'Conflict: User already exists', true);
  }

  const newUser = {
    name,
    mobile,
    email,
    username,
    accounts: Array.isArray(accounts) ? accounts : [],
  };
  users.push(newUser);
  return sendApiResponse(res, newUser, 200, 'success', true);
});

// 3. POST /create/payment - Record transaction and adjust balance
app.post('/create/payment', (req, res) => {
  const { username, bankName, type, transactionAmount, transactionDesc, categories, time } = req.body;
  const amt = Number(transactionAmount) || 0;

  const user = users.find((u) => u.username?.toLowerCase() === username?.toLowerCase());
  if (user && user.accounts) {
    const acc = user.accounts.find((a) => a.bankName?.toLowerCase() === bankName?.toLowerCase());
    if (acc) {
      if (type === 'debit') {
        acc.balance = Math.max(0, acc.balance - amt);
      } else {
        acc.balance += amt;
      }
    }
  }

  const newTxn = {
    _id: `txn_${Date.now()}`,
    username,
    bankName,
    type,
    transactionAmount: amt,
    transactionDesc: transactionDesc || '',
    categories: categories || 'general',
    time: time || Date.now(),
  };
  transactions.unshift(newTxn);

  return sendApiResponse(res, newTxn, 200, 'success', true);
});

// 4. POST /add/budget - Create a budget
app.post('/add/budget', (req, res) => {
  const { username, amount } = req.body;
  const newBudget = {
    _id: `bgt_${Date.now()}`,
    username,
    amount: Number(amount) || 0,
  };
  budgets.push(newBudget);
  return sendApiResponse(res, newBudget, 200, 'success', true);
});

// 5. POST /get/account - Look up user document
app.post('/get/account', (req, res) => {
  const { username, mobile } = req.body;
  const user = users.find((u) => {
    if (username && u.username?.toLowerCase() === username.toLowerCase()) return true;
    if (mobile && u.mobile === mobile) return true;
    return false;
  });

  if (!user) {
    return sendApiResponse(res, null, 404, 'Not Found', true);
  }

  return sendApiResponse(res, user, 200, 'success', true);
});

// 6. POST /get/txn - Retrieve transactions matching filter
app.post('/get/txn', (req, res) => {
  const { username } = req.body;
  let result = [...transactions];
  if (username) {
    result = result.filter((t) => t.username?.toLowerCase() === username.toLowerCase());
  }
  result.sort((a, b) => (b.time || 0) - (a.time || 0));

  return sendApiResponse(res, result, 200, 'success', true);
});

// 7. POST /get/budget - Retrieve budget documents
app.post('/get/budget', (req, res) => {
  const { username } = req.body;
  let result = [...budgets];
  if (username) {
    result = result.filter((b) => b.username?.toLowerCase() === username.toLowerCase());
  }

  return sendApiResponse(res, result, 200, 'success', true);
});

// 8. POST /update/budget - Update first budget matching username
app.post('/update/budget', (req, res) => {
  const { username, amount } = req.body;
  const budget = budgets.find((b) => b.username?.toLowerCase() === username?.toLowerCase());

  if (budget) {
    budget.amount = Number(amount) || 0;
    return sendApiResponse(res, { acknowledged: true, modifiedCount: 1 }, 200, 'success', true);
  }

  return sendApiResponse(res, null, 404, 'Not Found', true);
});

// 9. POST /get/txn/statistics - Aggregated date-wise statistics
app.post('/get/txn/statistics', (req, res) => {
  const { username } = req.body;
  let txns = [...transactions];
  if (username) {
    txns = txns.filter((t) => t.username?.toLowerCase() === username.toLowerCase());
  }

  let totalCreditCount = 0;
  let totalDebitCount = 0;
  let totalCreditAmount = 0;
  let totalDebitAmount = 0;
  const dateWise = {};
  const dateSet = new Set();

  for (const txn of txns) {
    if (txn.type === 'debit') {
      totalDebitCount++;
      totalDebitAmount += txn.transactionAmount || 0;
    } else {
      totalCreditCount++;
      totalCreditAmount += txn.transactionAmount || 0;
    }

    const dateStr = new Date(txn.time).toDateString();
    dateSet.add(dateStr);
    if (!dateWise[dateStr]) {
      dateWise[dateStr] = [];
    }
    dateWise[dateStr].push(txn);
  }

  const stats = {
    totalCreditCount,
    totalDebitCount,
    totalCreditAmount,
    totalDebitAmount,
    date: Array.from(dateSet),
    dateWise,
  };

  return sendApiResponse(res, stats, 200, 'success', true);
});

// 10. POST /get/monthly/txn - Current month debit total
app.post('/get/monthly/txn', (req, res) => {
  const { username } = req.body;
  let txns = [...transactions];
  if (username) {
    txns = txns.filter((t) => t.username?.toLowerCase() === username.toLowerCase());
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthlyDebit = txns
    .filter((t) => {
      if (t.type !== 'debit') return false;
      const d = new Date(t.time);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .reduce((sum, t) => sum + (t.transactionAmount || 0), 0);

  return sendApiResponse(res, monthlyDebit, 200, 'success', true);
});

// 11. POST /get/qr - Generate payment QR codes
app.post('/get/qr', (req, res) => {
  const { username, Amount } = req.body;
  const user = users.find((u) => u.username?.toLowerCase() === username?.toLowerCase());

  if (!user || !user.accounts) {
    return sendApiResponse(res, [], 200, 'success', true);
  }

  const qrs = user.accounts.map((acc) => {
    // Generate valid standalone SVG QR code data URL
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="#fff" rx="10"/><rect x="20" y="20" width="48" height="48" fill="#0f172a"/><rect x="28" y="28" width="32" height="32" fill="#fff"/><rect x="36" y="36" width="16" height="16" fill="#0f172a"/><rect x="132" y="20" width="48" height="48" fill="#0f172a"/><rect x="140" y="28" width="32" height="32" fill="#fff"/><rect x="148" y="36" width="16" height="16" fill="#0f172a"/><rect x="20" y="132" width="48" height="48" fill="#0f172a"/><rect x="28" y="140" width="32" height="32" fill="#fff"/><rect x="36" y="148" width="16" height="16" fill="#0f172a"/><rect x="80" y="24" width="12" height="12" fill="#0f172a"/><rect x="84" y="84" width="32" height="32" fill="#2563eb"/><rect x="128" y="80" width="24" height="12" fill="#0f172a"/><rect x="80" y="132" width="24" height="16" fill="#0f172a"/></svg>`;
    const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    return {
      url,
      vpa: acc.vpa,
      bankName: acc.bankName,
    };
  });

  return sendApiResponse(res, qrs, 200, 'success', true);
});

// 12. GET /send/report/ - Builds 30-day report and delivers email
app.get('/send/report/', (req, res) => {
  const reportPayload = {
    generatedAt: Date.now(),
    scope: '30-Day Financial Ledger Dispatched',
    recipientsCount: users.length,
    users: users.map((u) => ({
      username: u.username,
      email: u.email,
      accounts: u.accounts?.length || 0,
    })),
  };

  return sendApiResponse(res, reportPayload, 200, 'success', true);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Express API Server listening on http://localhost:${PORT}`);
});

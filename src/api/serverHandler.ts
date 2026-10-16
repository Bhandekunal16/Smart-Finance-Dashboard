import type { IncomingMessage, ServerResponse } from 'http';

// Database State in memory
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
    time: Date.now() - 1000 * 60 * 60 * 4,
  },
  {
    _id: 'txn_2',
    username: 'asha',
    bankName: 'Metro Commercial Bank',
    type: 'credit',
    transactionAmount: 5000.0,
    transactionDesc: 'Client Consulting Retainer',
    categories: 'salary',
    time: Date.now() - 1000 * 60 * 60 * 28,
  },
  {
    _id: 'txn_3',
    username: 'asha',
    bankName: 'Example Bank',
    type: 'debit',
    transactionAmount: 48.0,
    transactionDesc: 'Electricity & Utility Bill',
    categories: 'bills',
    time: Date.now() - 1000 * 60 * 60 * 72,
  },
  {
    _id: 'txn_4',
    username: 'asha',
    bankName: 'Example Bank',
    type: 'debit',
    transactionAmount: 85.0,
    transactionDesc: 'Online Book Purchase',
    categories: 'shopping',
    time: Date.now() - 1000 * 60 * 60 * 120,
  },
  {
    _id: 'txn_5',
    username: 'asha',
    bankName: 'Metro Commercial Bank',
    type: 'credit',
    transactionAmount: 1200.0,
    transactionDesc: 'Quarterly Dividend Deposit',
    categories: 'investment',
    time: Date.now() - 1000 * 60 * 60 * 200,
  },
];

let budgets = [
  {
    _id: 'bgt_1',
    username: 'asha',
    amount: 1500,
  },
];

function sendJson(res: ServerResponse, data: any, statusCode = 200) {
  res.statusCode = 200; // API doc: sends HTTP 200 with JSON payload
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function sendApiResponse(res: ServerResponse, data: any, statusCode = 200, msg = 'success', status = true) {
  sendJson(res, {
    data,
    status,
    statusCode,
    msg,
  });
}

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = (req.url || '').split('?')[0].replace(/\/$/, '') || '/';
  const method = (req.method || 'GET').toUpperCase();

  // 1. GET / - Health Check
  if (method === 'GET' && (url === '/' || url === '')) {
    sendJson(res, { message: 'hello world' });
    return true;
  }

  // 2. POST /create - Create user document
  if (method === 'POST' && url === '/create') {
    const body = await parseBody(req);
    const { name, mobile, email, username, accounts } = body;
    const existing = users.find(
      (u) =>
        u.username?.toLowerCase() === username?.toLowerCase() ||
        u.mobile === mobile ||
        u.email?.toLowerCase() === email?.toLowerCase()
    );

    if (existing) {
      sendApiResponse(res, null, 409, 'Conflict: User already exists', true);
      return true;
    }

    const newUser = {
      name,
      mobile,
      email,
      username,
      accounts: Array.isArray(accounts) ? accounts : [],
    };
    users.push(newUser);
    sendApiResponse(res, newUser, 200, 'success', true);
    return true;
  }

  // 3. POST /create/payment - Record transaction and adjust balance
  if (method === 'POST' && url === '/create/payment') {
    const body = await parseBody(req);
    const { username, bankName, type, transactionAmount, transactionDesc, categories, time } = body;
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
      _id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username,
      bankName,
      type: type || 'debit',
      transactionAmount: amt,
      transactionDesc: transactionDesc || (type === 'debit' ? 'Expense' : 'Income'),
      categories: categories || 'general',
      time: time || Date.now(),
    };
    transactions.unshift(newTxn);
    sendApiResponse(res, newTxn, 200, 'success', true);
    return true;
  }

  // 4. POST /add/budget - Create a budget
  if (method === 'POST' && url === '/add/budget') {
    const body = await parseBody(req);
    const { username, amount } = body;
    const newBudget = {
      _id: `bgt_${Date.now()}`,
      username,
      amount: Number(amount) || 0,
    };
    budgets.push(newBudget);
    sendApiResponse(res, newBudget, 200, 'success', true);
    return true;
  }

  // 5. POST /get/account - Retrieve user & account details
  if (method === 'POST' && url === '/get/account') {
    const body = await parseBody(req);
    const { username, mobile } = body;
    const user = users.find((u) => {
      if (username && u.username?.toLowerCase() === username.toLowerCase()) return true;
      if (mobile && u.mobile === mobile) return true;
      return false;
    });

    if (!user) {
      sendApiResponse(res, null, 404, 'Not Found', true);
      return true;
    }

    sendApiResponse(res, user, 200, 'success', true);
    return true;
  }

  // 6. POST /get/txn - Retrieve transactions matching filter
  if (method === 'POST' && url === '/get/txn') {
    const body = await parseBody(req);
    const { username } = body;
    let result = [...transactions];
    if (username) {
      result = result.filter((t) => t.username?.toLowerCase() === username.toLowerCase());
    }
    result.sort((a, b) => (b.time || 0) - (a.time || 0));
    sendApiResponse(res, result, 200, 'success', true);
    return true;
  }

  // 7. POST /get/budget - Retrieve budget documents
  if (method === 'POST' && url === '/get/budget') {
    const body = await parseBody(req);
    const { username } = body;
    let result = [...budgets];
    if (username) {
      result = result.filter((b) => b.username?.toLowerCase() === username.toLowerCase());
    }
    sendApiResponse(res, result, 200, 'success', true);
    return true;
  }

  // 8. POST /update/budget - Update budget
  if (method === 'POST' && url === '/update/budget') {
    const body = await parseBody(req);
    const { username, amount } = body;
    const budget = budgets.find((b) => b.username?.toLowerCase() === username?.toLowerCase());

    if (budget) {
      budget.amount = Number(amount) || 0;
      sendApiResponse(res, { acknowledged: true, modifiedCount: 1 }, 200, 'success', true);
      return true;
    }

    sendApiResponse(res, null, 404, 'Not Found', true);
    return true;
  }

  // 9. POST /get/txn/statistics - Aggregated date-wise statistics
  if (method === 'POST' && url === '/get/txn/statistics') {
    const body = await parseBody(req);
    const { username } = body;
    let txns = [...transactions];
    if (username) {
      txns = txns.filter((t) => t.username?.toLowerCase() === username.toLowerCase());
    }

    let totalCreditCount = 0;
    let totalDebitCount = 0;
    let totalCreditAmount = 0;
    let totalDebitAmount = 0;
    const dateWise: Record<string, any[]> = {};
    const dateSet = new Set<string>();

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

    sendApiResponse(
      res,
      {
        totalCreditCount,
        totalDebitCount,
        totalCreditAmount,
        totalDebitAmount,
        date: Array.from(dateSet),
        dateWise,
      },
      200,
      'success',
      true
    );
    return true;
  }

  // 10. POST /get/monthly/txn - Monthly debit total
  if (method === 'POST' && url === '/get/monthly/txn') {
    const body = await parseBody(req);
    const { username } = body;
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

    sendApiResponse(res, monthlyDebit, 200, 'success', true);
    return true;
  }

  // 11. POST /get/qr - Generate payment QR codes
  if (method === 'POST' && url === '/get/qr') {
    const body = await parseBody(req);
    const { username, Amount } = body;
    const user = users.find((u) => u.username?.toLowerCase() === username?.toLowerCase());

    if (!user || !user.accounts) {
      sendApiResponse(res, [], 200, 'success', true);
      return true;
    }

    const qrs = user.accounts.map((acc) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="#fff" rx="10"/><rect x="20" y="20" width="48" height="48" fill="#0f172a"/><rect x="28" y="28" width="32" height="32" fill="#fff"/><rect x="36" y="36" width="16" height="16" fill="#0f172a"/><rect x="132" y="20" width="48" height="48" fill="#0f172a"/><rect x="140" y="28" width="32" height="32" fill="#fff"/><rect x="148" y="36" width="16" height="16" fill="#0f172a"/><rect x="20" y="132" width="48" height="48" fill="#0f172a"/><rect x="28" y="140" width="32" height="32" fill="#fff"/><rect x="36" y="148" width="16" height="16" fill="#0f172a"/><rect x="80" y="24" width="12" height="12" fill="#0f172a"/><rect x="84" y="84" width="32" height="32" fill="#2563eb"/><rect x="128" y="80" width="24" height="12" fill="#0f172a"/><rect x="80" y="132" width="24" height="16" fill="#0f172a"/></svg>`;
      const qrUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      return {
        url: qrUrl,
        vpa: acc.vpa,
        bankName: acc.bankName,
      };
    });

    sendApiResponse(res, qrs, 200, 'success', true);
    return true;
  }

  // 12. GET /send/report/ - 30-day email report
  if (method === 'GET' && url === '/send/report') {
    sendApiResponse(
      res,
      {
        timestamp: Date.now(),
        usersReported: users.length,
        period: 'Last 30 Days',
        status: 'Delivered',
      },
      200,
      'success',
      true
    );
    return true;
  }

  return false;
}

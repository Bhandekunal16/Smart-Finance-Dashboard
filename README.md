# FinFlow Financial Hub — Express API Integration

A modern, responsive financial web application built with **React**, **Vite**, **Tailwind CSS**, and **Axios**, designed to integrate with your existing Express.js backend API as specified in `api(20261016-094625).md`.

---

## 1. Features Overview

- **Dashboard**: Aggregates total balance across user accounts, total debited/credited amounts, current month's debit total, recent transactions, and date-wise income vs. expense Area and Bar charts.
- **Accounts & User Profiles**:
  - Create users with name, mobile number, email, username, and multiple dynamic account details (savings, current, salary, investment).
  - Retrieve user information by username or 10-digit mobile number via `POST /get/account`.
  - Sensitive account number masking enabled by default with one-click reveal/hide.
  - Quick-copy VPA and direct payment links.
- **Transaction Ledger**:
  - Record credit and debit payments with bank selection, categories, timestamp, amount, and description (`POST /create/payment`). Account balances automatically update on the backend.
  - Filter by transaction type (All, Debit, Credit), category, bank, and date range.
  - Live client-side search across descriptions, categories, amounts, and banks.
  - Detailed modal receipt view and CSV ledger export.
- **Budget Management**:
  - Create monthly expenditure caps (`POST /add/budget`).
  - Update existing budget limits (`POST /update/budget`).
  - Live visual progress meter comparing current month's debit total (`POST /get/monthly/txn`) against the budget.
  - Multi-tiered visual status indicators: Normal (<80%), Warning (≥80%), and Exceeded (>100%).
- **Payment QR Codes**:
  - Generate standard UPI payment QR code images for all linked accounts (`POST /get/qr`).
  - Supports optional requested amount injection.
  - Download QR codes as images or copy VPA strings to clipboard.
- **Reports & Analytics**:
  - Visualizes date-wise transaction inflow and outflow using Recharts.
  - Category spending breakdown pie chart.
  - Summary KPI cards for net cash flow, debit counts, and credit counts.
  - Protected trigger button for 30-day email reports (`GET /send/report/`) with confirmation dialog.
- **Settings & API Diagnostics**:
  - Connected to backend server `http://147.224.251.137:8001`.
  - Live API ping and latency measurement on `GET /`.
  - Active user switcher and account masking controls.
  - Light and Dark theme modes with instant switching.

---

## 2. Technology Stack

- **Framework**: React 19 + Vite 8
- **Navigation**: React Router (DOM)
- **HTTP Client**: Axios with centralized error normalization
- **Styling**: Tailwind CSS v4 with custom dark mode
- **Charts**: Recharts (Responsive Area, Bar, and Pie charts)
- **Icons**: Lucide React

---

## 3. API Endpoints Reference

The application integrates with the Express API using the following endpoints:

| Method | Endpoint | Purpose | Request Body |
|---|---|---|---|
| `GET` | `/` | API health check | None |
| `POST` | `/create` | Create a user document | `{ name, mobile, email, username, accounts }` |
| `POST` | `/create/payment` | Record a transaction & adjust balance | `{ username, bankName, type, transactionAmount, transactionDesc, categories, time }` |
| `POST` | `/add/budget` | Create a budget document | `{ username, amount }` |
| `POST` | `/get/account` | Retrieve account & user details | `{ username }` or `{ mobile }` |
| `POST` | `/get/txn` | Retrieve transactions sorted by time | `{ username }` |
| `POST` | `/get/budget` | Retrieve budget documents | `{ username }` |
| `POST` | `/update/budget` | Update existing budget amount | `{ username, amount }` |
| `POST` | `/get/txn/statistics` | Aggregated date-wise statistics | `{ username }` |
| `POST` | `/get/monthly/txn` | Retrieve current month debit total | `{ username }` |
| `POST` | `/get/qr` | Generate payment QR code data URLs | `{ username, Amount? }` |
| `GET` | `/send/report/` | Trigger 30-day report and email dispatch | None |

### Handling Inconsistent Status Codes
As noted in the API reference, the backend occasionally returns application errors with HTTP `200` status (such as `statusCode: 409` or `msg: "Conflict"` for duplicate users, or `data: null` for missing accounts). The application's `src/api/axios.ts` response parser inspects `statusCode`, `msg`, `status`, and `data` fields to provide accurate error messaging and UI states.

---

## 4. Getting Started & Running Together

### Prerequisites
- Node.js (v18+)
- npm

### 1. Environment Configuration
Create a `.env` file in the root directory (based on `.env.example`):

```bash
# Backend server configuration
VITE_API_BASE_URL="http://147.224.251.137:8001"
```

### 2. Start Your Existing Express Backend
In your backend project directory:
```bash
node index.js
```
*(Ensure CORS is enabled so the frontend at port 3000 can communicate with port 4000/8000).*

Alternatively, you can test with the included reference server:
```bash
node backend-server.js
```

### 3. Start the Frontend
In this app directory:
```bash
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 5. Application Architecture

```text
src/
├── api/
│   ├── axios.ts               # Central Axios client and response parser
│   ├── userApi.ts             # User creation, lookup, QR codes, and health check
│   ├── transactionApi.ts      # Payments, transactions, and statistics
│   ├── budgetApi.ts           # Add, retrieve, and update budgets
│   ├── reportApi.ts           # 30-day email report trigger
│   └── mockSimulator.ts       # In-browser fallback engine for offline testing
├── components/
│   ├── common/                # StatCard, Modal, Skeleton, EmptyState, MaskedText
│   ├── layout/                # AppLayout, Sidebar, Topbar, ApiStatusBar
│   ├── accounts/              # CreateUserModal
│   ├── transactions/          # AddTransactionModal
│   └── budgets/               # CreateBudgetModal, UpdateBudgetModal
├── context/
│   ├── ApiConfigContext.tsx   # Base URL, active user, health check, masking state
│   ├── ThemeContext.tsx       # Light / Dark theme state
│   └── ToastContext.tsx       # Toast notifications
├── pages/
│   ├── Dashboard.tsx          # Key metrics, charts, recent transactions
│   ├── Accounts.tsx           # User profile and linked bank accounts
│   ├── Transactions.tsx       # Transaction ledger, filters, and receipt view
│   ├── Budgets.tsx            # Budget tracking and threshold warnings
│   ├── QRCodePage.tsx         # Payment QR codes with custom amount support
│   ├── Reports.tsx            # Date-wise analytics and email report trigger
│   └── Settings.tsx           # Backend URL configuration and diagnostics
├── types/
│   └── index.ts               # TypeScript data models and API response types
├── utils/
│   ├── formatters.ts          # Currency, date, and masking formatters
│   └── validation.ts          # Form validation rules
├── App.tsx                    # Routes and layout shell
└── main.tsx                   # React root entrypoint
```

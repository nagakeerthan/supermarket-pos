# 🛒 Kalaasagar SuperMarket - Enterprise POS & Billing Management System

[![Vite](https://img.shields.io/badge/Vite-8.2+-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

A enterprise-grade Point of Sale (POS), Real-Time Inventory Tracking, and Billing Management System built for high-throughput retail supermarkets. Designed with speed, precision, thermal receipt printing, barcode hardware scanning, and cloud persistence with MongoDB Atlas.

---

## ✨ Key Features

- ⚡ **Ultra-Fast POS Terminal**: Real-time barcode scanning, quick category filtering, cart holding, discount management, and instant calculation.
- 🖨️ **Thermal Receipt & PDF Printing**:
  - Customizable 80mm & 58mm thermal receipts with store logo, GSTIN, FSSAI, header/footer text, and QR code for UPI payments.
  - Multi-page professional Tax Invoices & A4 PDF downloads with custom formatting.
- 📦 **Master Inventory & Stock Management**:
  - Pre-seeded with 8,000+ real FMCG supermarket items and barcodes.
  - Low-stock and Out-of-stock live alerts, custom reorder levels, batch barcode generation, and barcode printable labels.
  - Bulk CSV import/export for catalogs and stock adjustments.
- 📊 **Executive Analytics & Reports**:
  - Sales trends, revenue vs profit margins, top-selling categories, hourly rush distributions, and payment breakdown (Cash, UPI, Card, Loyalty points).
  - Date calendar slicer, custom date ranges, and CSV/PDF exportable financial audits.
- 👥 **Customers & Loyalty Rewards**:
  - Customer purchase history, loyalty points accumulation, and instant point redemption during checkout.
- 🚚 **Supplier & Vendor Management**:
  - Supplier directories, procurement tracking, and contact management.
- 🛡️ **Role-Based Cashier Management & Audit Trails**:
  - Admin, Cashier, and Manager permission levels.
  - Real-time audit timeline logging every bill, refund, stock adjustment, and price change.
- ⌨️ **High-Speed Keyboard Shortcuts**:
  - Full keyboard-driven navigation (`F2` for search, `F8` for hold bill, `Space` for quick pay, `Esc` to cancel, etc.).
- 🔊 **Audio & POS Hardware Feedback**:
  - Synthesized Web Audio beeps for successful barcode scans, payments, errors, and receipt printing.
- 🌐 **Dual Persistence (Cloud + Local Fallback)**:
  - Connects seamlessly to MongoDB Atlas for real-time multi-terminal synchronization.
  - Built-in LocalStorage cache fallback ensuring uninterrupted offline operation during internet outages.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand (State Management), Framer Motion, Recharts, Lucide Icons.
- **Backend / API**: Express 5, Node.js, MongoDB Driver, CORS, Dotenv.
- **Utilities**: `jspdf`, `jspdf-autotable`, `jsbarcode`, `qrcode.react`, `papaparse`, `html2canvas`, `canvas-confetti`.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** 20.x or higher
- **npm** 10.x or higher
- **MongoDB Atlas** database connection URI (optional for offline testing, required for cloud sync)

### 2. Clone & Install
```bash
git clone https://github.com/<your-username>/supermarketposantigravity.git
cd supermarketposantigravity
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory (or copy from `.env.example`):
```bash
cp .env.example .env
```
Update `.env` with your settings:
```env
# Application Details
VITE_APP_NAME="Kalaasagar SuperMarket"
VITE_APP_DESCRIPTION="Enterprise POS & Billing Management System"
VITE_APP_VERSION="2.4.0"

# Backend Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection URI
MONGO_URI="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"

# Frontend API URL
VITE_API_BASE_URL="http://localhost:5000/api"
```

### 4. Run the Application
In one terminal, start the Backend API:
```bash
npm run server
```

In a second terminal, start the Frontend Vite dev server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🚢 Deployment Guide

### Option 1: Full-Stack Single-Service (Render / Railway / VPS / Docker)
The Express backend (`server/index.js`) is configured to serve the compiled frontend (`dist/`) automatically in production.

1. **Build & Start**:
   ```bash
   npm run build
   npm start
   ```
2. **Environment Variables on Render/Railway**:
   - `PORT`: `5000` (or dynamic `$PORT`)
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `mongodb+srv://...`
   - `VITE_API_BASE_URL`: `/api` (uses same-origin)

---

### Option 2: Split Deployment (Vercel / Netlify Frontend + Cloud Backend)

#### Frontend on Vercel:
1. Connect the repository to Vercel.
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Set Environment Variable in Vercel Dashboard:
   - `VITE_API_BASE_URL`: `https://your-backend-api-url.onrender.com/api`

#### Frontend on Netlify:
- The included `public/_redirects` ensures SPA routing (`/* /index.html 200`) functions out of the box.

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Action |
| :--- | :--- |
| `F2` | Focus Barcode / Product Search Box |
| `F4` | Open Discount / Coupon Dialog |
| `F8` | Hold Current Cart / View Held Carts |
| `F9` | Open Thermal Receipt Format Settings |
| `F10` | Fullscreen Toggle |
| `Space` | Quick Cash Checkout (Exact Amount) |
| `Enter` | Complete Payment & Print Receipt |
| `Esc` | Close Active Modal / Cancel Operation |

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

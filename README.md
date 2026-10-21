# BoutiqueSaaS — Multi-Tenant Clothing Commerce SaaS

A modern, multi-tenant ecommerce SaaS platform engineered for small Indian clothing boutiques and Instagram/WhatsApp-first apparel sellers.

Each seller can launch a branded storefront, manage clothing collections (Kurtis, Sarees, Co-ord Sets, Lehengas), size and color variants, real-time inventory, promotional discount coupons, and receive direct Cash on Delivery (COD) and WhatsApp orders.

---

## 🚀 Key Features

### For Boutique Sellers (Seller Workspace)
- **Instant Store Onboarding:** Launch a branded online storefront with a custom URL slug in under 60 seconds.
- **Clothing Catalog & Variant Management:** Manage apparel items with size variants (XS, S, M, L, XL, Free Size), color shades, SKUs, and stock counts.
- **Stock & Inventory Locking:** Automatic stock tallying and atomic conditional reservation preventing overselling.
- **Discount Engine:** Create percentage or flat Indian Rupee coupons (e.g., `WELCOME10`, `FESTIVE500`) with minimum order thresholds and maximum caps.
- **Order Processing & State Machine:** Enforce strict valid status transitions (`PENDING` → `CONFIRMED` → `SHIPPED` → `DELIVERED` / `CANCELLED`), with automatic stock restoration upon cancellation.
- **One-Click WhatsApp Customer Contact:** Message buyers directly on WhatsApp with pre-filled order status updates.

### For Shoppers (Public Storefront)
- **Mobile-First Boutique Experience:** Clean, responsive UI tailored for Indian mobile shoppers.
- **Real-Time Size & Shade Availability:** Clear stock indicators per variant.
- **Instant Bag & Checkout:** Indian checkout flow supporting Cash on Delivery (COD) and WhatsApp UPI payments.
- **Instant WhatsApp Confirmation:** Immediate redirection option to confirm orders with boutique owners on WhatsApp.

---

## 🛠️ Tech Stack (MERN)

- **Database:** MongoDB Atlas (Mongoose ODM) with tenant-scoped indexes, unique compound indexes, and session storage.
- **Backend:** Node.js & Express.js (Modular monolith: thin controllers, rich domain services, validated DTOs).
- **Session Management:** `express-session` backed by `connect-mongo` (HttpOnly, Secure, SameSite cookies; zero sensitive tokens in localStorage).
- **Security:** Helmet, CORS allowlists, Rate limiters for auth and checkout (`express-rate-limit`), bcrypt password hashing.
- **Frontend:** React 18, Vite, React Router DOM, Lucide React icons, mobile-responsive styling.
- **Currency:** Integer minor units (`paise` for INR: 1 INR = 100 paise) preventing floating-point arithmetic errors.

---

## 📂 Repository Structure

```
├── docs/
│   └── AI_Developer_Master_Prompt.md   # Product & engineering source of truth
├── server/
│   ├── src/
│   │   ├── config/                     # Database, session, and env configuration
│   │   ├── models/                     # User, Store (Tenant), Product, Order, Discount
│   │   ├── middlewares/                # Auth, Tenant isolation, Rate limiters, Error handler
│   │   ├── services/                   # Business logic (Auth, Store, Product, Order, Discount)
│   │   ├── controllers/                # Thin HTTP controllers
│   │   ├── routes/                     # Tenant-scoped and public storefront API routes
│   │   ├── utils/                      # Minor units money calculator, API response envelopes
│   │   ├── app.js                      # Express application setup
│   │   └── server.js                   # Server bootstrap & graceful shutdown
│   ├── tests/
│   │   ├── unit.test.js                # Minor units, Order state machine & discount tests
│   │   └── runner.js                   # Test runner
│   └── package.json
├── client/
│   ├── src/
│   │   ├── api/                        # Central API client with session credential support
│   │   ├── context/                    # AuthContext (sessions), CartContext (local shopping bag)
│   │   ├── components/                 # Navbar, SellerLayout, StorefrontLayout
│   │   ├── pages/
│   │   │   ├── Home.jsx                # Landing page
│   │   │   ├── seller/                 # Login, Register, Dashboard, Products, Orders, Discounts, Settings
│   │   │   └── storefront/             # StoreCatalog, ProductDetail, CartCheckout, OrderSuccess
│   │   ├── utils/                      # INR currency & date formatting
│   │   ├── App.jsx                     # Route architecture
│   │   └── index.css                   # Custom responsive boutique theme
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .env.example
├── .gitignore
└── package.json
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` in the root and in `server/`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.ntr6p17.mongodb.net/clothing_saas?retryWrites=true&w=majority
SESSION_SECRET=your-random-high-entropy-session-secret-here
CLIENT_URL=http://localhost:5173
COOKIE_DOMAIN=localhost
```

---

## 🚦 Getting Started

### 1. Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Run in Development Mode
You can start both backend and frontend concurrently from root, or independently:

```bash
# From server directory (runs on port 5000)
npm run dev

# From client directory (runs on port 5173)
npm run dev
```

### 3. Run Automated Tests
```bash
cd server
npm test
```

---

## 🔒 Security & Tenant Isolation Principles

1. **Mandatory Tenant Scoping:** Every seller endpoint validates that the target store ID is authorized for the authenticated user session via `requireStoreScope` middleware.
2. **Server-Side Price & Inventory Revalidation:** The server re-calculates pricing from database records and atomically decrements stock (`$gte` conditional update) during checkout.
3. **Integer Minor Units:** All monetary values are handled and saved in paise (1 INR = 100 paise), avoiding float rounding issues.
4. **Order State Machine:** Orders can only advance through defined transitions:
   - `PENDING` → `CONFIRMED` or `CANCELLED`
   - `CONFIRMED` → `SHIPPED` or `CANCELLED`
   - `SHIPPED` → `DELIVERED` or `CANCELLED`
   - Cancelling an order automatically restores inventory stock.

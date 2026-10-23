# BoutiqueSaaS — Multi-Tenant Clothing Commerce SaaS

A modern, multi-tenant e-commerce SaaS platform engineered specifically for small Indian clothing boutiques and Instagram/WhatsApp-first apparel sellers.

Each boutique owner can launch a branded storefront, manage apparel collections (*Kurtis, Sarees, Co-ord Sets, Lehengas*), size/color variants, real-time inventory, scheduled promotional sales campaigns, and process direct Cash on Delivery (COD) and WhatsApp orders.

---

## 🚀 Key Features

### For Boutique Sellers (Seller Workspace)
- **Instant Store Onboarding:** Launch a branded online storefront with a custom URL slug in under 60 seconds.
- **Apparel Catalog & Variant Management:** Portal-based responsive product modal with fixed header/footer, independent scrolling, body scroll lock, Escape key dismissal, and unsaved changes confirmation.
- **Custom Boutique Categories:** Create custom apparel categories (e.g., *Bridal Lehengas*, *Organza Sarees*) with instant dropdown and filter synchronization.
- **Promotions & Scheduled Sales:** Schedule verified promotional campaigns (*Diwali Festive Sale*, *Under ₹999 Clearance*, *Flat 40% Off Handloom Sarees*) with start/end date scheduling, discount types, custom gradient themes, and live storefront banners.
- **Atomic Stock Reservation:** Concurrency-safe stock updates using MongoDB `$gte` conditional decrements, preventing overselling under high checkout traffic.
- **Order State Machine:** Enforces valid status transitions (`PENDING` → `CONFIRMED` → `SHIPPED` → `DELIVERED` or `CANCELLED`), with automatic stock restoration upon cancellation.
- **WhatsApp Customer Support:** Message buyers directly on WhatsApp with pre-filled order status updates and inquiries.

### For Shoppers (Public Boutique Storefront)
- **Mobile-First Boutique Experience:** Clean, responsive UI tailored for Indian mobile shoppers.
- **Store-Backed Promotional Deals:** 100% authentic promotional cards populated directly from active/upcoming seller campaigns and verified inventory metrics (no fabricated discounts).
- **Multi-Field Product Search:** Search across apparel name, category, fabric description, and variant color with regex sanitization and one-click clear button.
- **Active Navigation States:** Persistent tab highlighting (`Catalog`, `Track Order`, `Bag`) with accessible `aria-current="page"` markup.
- **Reliable Order Tracking:** Look up orders via Order Number and Mobile Number, complete with privacy address masking, fulfillment timeline, and WhatsApp support.
- **Cash on Delivery (COD):** Seamless Indian checkout experience with atomic inventory reservation and WhatsApp confirmation.

---

## 🛠️ Tech Stack (MERN)

- **Database:** MongoDB Atlas (Mongoose ODM) with tenant-scoped indexes, unique compound indexes, and session storage.
- **Backend:** Node.js & Express.js (Modular monolith: thin controllers, rich domain services, validated DTOs).
- **Session Management:** `express-session` backed by `connect-mongo` (HttpOnly, Secure, SameSite cookies; zero sensitive tokens in localStorage).
- **Security:** Helmet, CORS allowlists, Rate limiters for auth and checkout (`express-rate-limit`), bcrypt password hashing, and privacy data masking.
- **Frontend:** React 18, Vite, React Router DOM, Lucide React icons, Portal-based modals, mobile-responsive boutique styling.
- **Currency:** Integer minor units (**paise**: 1 INR = 100 paise) preventing floating-point arithmetic errors.

---

## 📂 Repository Structure

```
├── docs/
│   ├── AI_Developer_Master_Prompt.md   # Product & engineering source of truth
│   ├── BUG_FIXES_AND_IMPROVEMENTS.md   # Detailed audit, root causes, and fixes
│   ├── PRODUCT_AND_PROMOTION_WORKFLOW.md # Apparel catalog & promotion guide
│   ├── ORDER_TRACKING_WORKFLOW.md      # Order tracking architecture & privacy
│   └── TESTING_AND_VERIFICATION.md     # Test suite specifications & verification
├── server/
│   ├── src/
│   │   ├── config/                     # Database, session, and env configuration
│   │   ├── models/                     # User, Store, Product, Order, Discount, Campaign
│   │   ├── middlewares/                # Auth, Tenant isolation, Rate limiters, Error handler
│   │   ├── services/                   # Business logic (Auth, Store, Product, Order, Discount, Campaign)
│   │   ├── controllers/                # Thin HTTP controllers
│   │   ├── routes/                     # Tenant-scoped and public storefront API routes
│   │   ├── utils/                      # Minor units money calculator, API response envelopes
│   │   ├── app.js                      # Express application setup
│   │   └── server.js                   # Server bootstrap & graceful shutdown
│   ├── tests/
│   │   ├── unit.test.js                # Minor units, State machine, Discount, Campaign tests
│   │   ├── promotions-and-products.test.js # Validation, Multi-field search, Deals engine
│   │   ├── audit-regression.js         # Cross-tenant isolation & race condition tests
│   │   └── runner.js                   # Test runner
│   └── package.json
├── client/
│   ├── src/
│   │   ├── api/                        # Central API client with session credential support
│   │   ├── context/                    # AuthContext (sessions), CartContext (local shopping bag)
│   │   ├── components/                 # Navbar, SellerLayout, StorefrontLayout
│   │   ├── pages/
│   │   │   ├── Home.jsx                # Landing page
│   │   │   ├── seller/                 # Dashboard, Products, Promotions, Orders, Discounts, Settings
│   │   │   └── storefront/             # StoreCatalog, ProductDetail, CartCheckout, OrderSuccess, OrderTrack
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

Copy `.env.example` to `.env` in `server/`:

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
```bash
# Start backend server (port 5000)
cd server
npm run dev

# Start frontend application (port 5173)
cd client
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## 🧪 Testing & Verification

Execute all test suites:

```bash
# 1. Run Unit Tests
npm test

# 2. Run Product Validation & Promotions Integration Suite
node server/tests/promotions-and-products.test.js

# 3. Run Production Readiness Audit Regression Suite (Tenant isolation, race conditions)
node server/tests/audit-regression.js
```

---

## 📞 Platform Builder & Business Inquiries

Interested in launching a boutique e-commerce platform for your clothing brand or studio?

- **Lead Engineer & Builder:** Abhishek
- **Phone / WhatsApp:** [+91 6290197418](tel:+916290197418) / [Chat on WhatsApp](https://wa.me/916290197418)
- **Email:** [abhi281500@gmail.com](mailto:abhi281500@gmail.com)
- **Repository:** [https://github.com/abhi281500/Clothing-Saas](https://github.com/abhi281500/Clothing-Saas)

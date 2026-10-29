# Production Deployment, Security Architecture & Anti-Hijacking Guide

This document explains the root causes of the production failures observed on Vercel (`clothing-saas-eight.vercel.app`) and Render (`clothing-brand-af0u.onrender.com`), details the architectural solutions implemented, and provides a security and operational blueprint for production maintenance.

---

## 1. Root Cause Analysis of Reported Production Failures

### 1.1 Problem 1: `401 Unauthorized` on `/api/stores/dashboard-stats` (Session Cookie Stripping)

#### The Observed Symptom
In DevTools (Image 1):
- Seller logs in successfully at `/seller/login`.
- Redirects to `/seller/dashboard`.
- Request to `GET https://clothing-brand-af0u.onrender.com/api/stores/dashboard-stats` fails with `401 Unauthorized`.
- Inspection of Request Headers reveals **zero `Cookie:` header** sent by the browser.

#### The Technical Root Cause
1. **Cross-Site `SameSite=Strict` Collision:**
   The frontend is hosted on Vercel (`clothing-saas-eight.vercel.app`) and the backend is hosted on Render (`clothing-brand-af0u.onrender.com`). These are **two distinct public registrable domains** (cross-site).
   Previously, `server/src/config/session.js` configured:
   ```javascript
   sameSite: config.isProduction ? 'strict' : 'lax'
   ```
   Under the RFC 6265bis cookie specification, `SameSite=Strict` strictly forbids the browser from attaching the cookie to any cross-site asynchronous request (`fetch` / `XHR`). Even with `credentials: 'include'`, the browser refused to send `clothing_saas_sid` to Render, leaving `req.session.userId` undefined.

2. **Missing `app.set('trust proxy', 1)` behind Render's Reverse Proxy:**
   Render operates an SSL-terminating reverse proxy (Cloudflare/Envoy/nginx) in front of Node.js web services. Requests arrive at Node over plaintext HTTP with headers `X-Forwarded-Proto: https` and `X-Forwarded-For`.
   Without `app.set('trust proxy', 1)` in Express:
   - Express considers `req.secure === false`.
   - `express-session` refuses to issue `cookie.secure: true` cookies over connections it perceives as non-HTTPS.
   - `express-rate-limit` reads the Render load balancer IP instead of the client's actual IP, causing premature rate-limit triggers.

---

### 1.2 Problem 2: `404 NOT_FOUND` on `/store/fashion-hub` (SPA Client-Side Routing)

#### The Observed Symptom
In DevTools (Image 2):
- Seller clicks "View My Store" or navigates directly to `https://clothing-saas-eight.vercel.app/store/fashion-hub`.
- Vercel displays its default black error page: `"404 NOT_FOUND: This page doesn't exist"`.

#### The Technical Root Cause
React Router is a client-side Single Page Application (SPA) routing library. When a user requests a nested path like `/store/fashion-hub` or `/seller/dashboard`:
- Without a `vercel.json` rewrites configuration, Vercel attempts to locate a physical file at `dist/store/fashion-hub` or `dist/store/fashion-hub.html`.
- Because no such file exists on the static server, Vercel aborts with `404 NOT_FOUND`.
- SPAs require an edge rewrite rule that instructs the host to serve `index.html` for all non-API paths, allowing React Router to mount and resolve `/store/:slug` in the browser.

---

## 2. Solutions Implemented

### 2.1 Dual-Architecture API Proxy & SPA Routing (`vercel.json`)
Created `vercel.json` at the repository root and inside `client/vercel.json`:

```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/api/:match*",
      "destination": "https://clothing-brand-af0u.onrender.com/api/:match*"
    },
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

#### What This Achieves:
1. **Eliminates Vercel 404s:** All deep links (`/store/:slug`, `/seller/dashboard`, `/seller/products`, `/store/:slug/track`) serve `/index.html`, allowing React Router to render seamlessly.
2. **First-Party Cookie Isolation (Anti-Blocking):** When the frontend calls relative `/api/...`, Vercel's secure edge forwards the request to Render. To the user's browser, the request is **100% same-origin** with `clothing-saas-eight.vercel.app`.
   - Eliminates third-party cookie blocking in Apple Safari (ITP), Google Chrome, and Brave.
   - Works flawlessly in Private / Incognito browsing modes.
   - Eliminates cross-origin CORS preflight overhead for standard requests.

### 2.2 Backend Reverse-Proxy & Cross-Origin Session Hardening
Updated `server/src/app.js` and `server/src/config/session.js`:

1. **Enabled Trust Proxy:**
   ```javascript
   app.set('trust proxy', 1);
   ```
2. **Reverse Proxy Session Trust & `SameSite=None` Fallback:**
   ```javascript
   const sameSiteSetting = config.isProduction
     ? (process.env.COOKIE_SAMESITE || 'none')
     : 'lax';

   return session({
     name: 'clothing_saas_sid',
     secret: config.sessionSecret,
     resave: false,
     saveUninitialized: false,
     store,
     proxy: true, // Crucial for reverse proxies
     cookie: {
       httpOnly: true,
       secure: config.isProduction, // Mandatory HTTPS in production
       sameSite: sameSiteSetting,
       path: '/',
       maxAge: 7 * 24 * 60 * 60 * 1000,
     },
   });
   ```
3. **Resilient CORS Allowlist:**
   Permits `clothing-saas-eight.vercel.app`, any Vercel deployment matching `clothing-saas-*.vercel.app`, and comma-separated custom domains configured in `CLIENT_URL`.

---

## 3. Comprehensive Security, Privacy & Anti-Hijacking Safeguards

```mermaid
flowchart TD
    subgraph Browser Security
        A["HttpOnly Flag"] -->|Stops XSS Theft| S["Session Cookie (clothing_saas_sid)"]
        B["Secure Flag"] -->|Forces TLS/HTTPS| S
        C["SameSite Guard"] -->|Prevents Cross-Site Leaks| S
    end

    subgraph Authentication Layer
        D["User Login / Registration"] -->|regenerateSession| E["New Session ID Issued\n(Anti-Session Fixation)"]
        F["User Logout"] -->|session.destroy + clearCookie| G["Server Store Invalidated\n(Anti-Replay)"]
    end

    subgraph Tenant Authorization
        H["Seller Request"] -->|requireAuth| I["Active Session Validated"]
        I -->|requireStoreScope| J["req.user.stores.includes(targetStore)\n(Anti-BOLA / IDOR)"]
    end

    subgraph Public Data Protection
        K["Track Order Request"] -->|Order # + Phone Match| L["Dual-Key Verification"]
        L --> M["Street Address Line Redacted\nPhone Number Masked (98****3210)\ninternalNotes Excluded"]
    end
```

### 3.1 Session Hijacking & Fixation Protection
- **Session Rotation:** On every login (`authController.login`) and registration (`authController.register`), the server calls `req.session.regenerate()`, discarding the old session identifier and issuing a fresh cryptographic ID. This prevents session fixation attacks where an attacker pre-seeds a session ID.
- **`HttpOnly` Cookie Flag:** Disallows client-side JavaScript from reading `document.cookie`, preventing session extraction via Cross-Site Scripting (XSS).
- **`Secure` Cookie Flag:** In production, cookies are transmitted solely over TLS/HTTPS, preventing plaintext eavesdropping on public Wi-Fi.
- **Explicit Invalidation on Logout:** Calling `authController.logout` destroys the session record in MongoDB Atlas (`collection: 'sessions'`) and issues an explicit `res.clearCookie` with matching flags. Stale session IDs cannot be replayed.

### 3.2 Tenant Isolation & Broken Object Level Authorization (BOLA/IDOR)
- **Zero Trust for Client-Supplied Store IDs:** All seller endpoints pass through [`requireStoreScope`](file:///c:/Clothing%20Saas/server/src/middlewares/tenant.js). Even if an attacker modifies the `storeId` query parameter, body field, or `x-store-id` header, the middleware verifies that `req.user.stores.includes(requestedStoreId)`. If unauthorized, it immediately terminates with `403 Forbidden` (`TENANT_ACCESS_DENIED`).
- **Scoped Database Operations:** All service methods scope queries by `{ _id: resourceId, storeId }`. A seller cannot read, update, or delete apparel, variants, discount coupons, or orders belonging to another tenant.

### 3.3 Customer Data Privacy & Anti-Surveillance
- **Dual-Key Order Verification:** Public order tracking (`/api/storefront/:slug/track-order`) requires **both** the human-readable Order Number (e.g., `ORD-1729000000000-XYZ`) and the customer's 10-digit mobile number.
- **Privacy Redaction:**
  - Street address lines are masked with `'*** (Protected for customer privacy)'`.
  - Phone numbers are masked (e.g., `98****3210`).
  - Internal seller notes (`internalNotes`) are stripped from the Mongoose projection via `.select('-internalNotes')`.
- **Phone Normalization:** Client and server normalize phone numbers (stripping non-digits, international prefixes `+91`, and leading zeros) to ensure legitimate shoppers are never locked out of their tracking records.

### 3.4 Rate Limiting & Denial of Service (DoS) Defense
- **Authentication Limiter:** Restricted to 30 requests per 15 minutes per IP (`authLimiter`) to thwart brute-force password guessing.
- **Checkout Limiter:** Restricted to 20 checkout attempts per 5 minutes per IP (`checkoutLimiter`) to prevent automated carding or bot spam.
- **General API Limiter:** Applied across `/api` at 200 requests per minute (`generalApiLimiter`).

---

## 4. Production Environment Configuration Checklist

### 4.1 Render Backend Service (`clothing-brand-af0u.onrender.com`)
In Render Dashboard -> **Environment Variables**:

| Variable | Recommended Value | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production security optimizations and cookie flags |
| `PORT` | `5000` | Port for Express server |
| `MONGODB_URI` | `mongodb+srv://abhi281500_db_user:...@cluster0.ntr6p17.mongodb.net/clothing_saas?retryWrites=true&w=majority` | Production database connection |
| `SESSION_SECRET` | *(64-character high-entropy random string)* | Cryptographic key for session signing |
| `CLIENT_URL` | `https://clothing-saas-eight.vercel.app` | CORS allowed origin |
| `COOKIE_SAMESITE` | `none` | Allows cross-origin credentials if calling Render directly |
| `COOKIE_DOMAIN` | *(leave empty / unset)* | Scopes cookie to host |

### 4.2 Vercel Frontend Service (`clothing-saas-eight.vercel.app`)
In Vercel Dashboard -> **Settings** -> **Environment Variables**:

| Variable | Recommended Value | Note |
| :--- | :--- | :--- |
| `VITE_API_URL` | *(leave empty or set to `/api`)* | **Recommended:** Leaving this empty routes API calls via the Vercel rewrite proxy to Render, avoiding third-party cookie restrictions entirely. |
| *(Alternative)* | `https://clothing-brand-af0u.onrender.com/api` | Direct cross-origin mode (supported by our hardened `SameSite=None; Secure` configuration). |

### 4.3 Preventing Render Free-Tier Cold Starts
Render free-tier web services sleep after 15 minutes of inactivity. When a customer or seller visits, the first request may take ~30–50 seconds to boot.
**Recommendation:**
Set up a free HTTP ping to `https://clothing-brand-af0u.onrender.com/api/health` every 10 minutes using a free uptime monitor (e.g., [Cron-Job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com)). This keeps the Render container warm 24/7 with zero cold starts.

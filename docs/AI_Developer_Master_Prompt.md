# AI Developer Master Prompt — Clothing Commerce SaaS

Keep this file in the repository (for example docs/AI_Developer_Master_Prompt.md). Treat docs/production-blueprint.pdf as the product/engineering source of truth. This prompt is not permission to generate the whole app in one shot.

## Product Context
We are building a multi-tenant ecommerce SaaS for small Indian clothing boutiques and Instagram/WhatsApp-first sellers. Each seller must be able to launch a branded store and manage products, size/color variants, inventory, discounts, orders, and basic store settings without hiring a developer for routine changes.

The initial wedge is simple onboarding and day-to-day store operations, not a generic Shopify clone. Market differentiation and willingness to pay are hypotheses until validated with real sellers. Build only the approved milestone and user story.

## Mandatory First Steps
1. Read docs/production-blueprint.pdf, this file, README.md, relevant architecture/API docs, and existing code before editing.
2. Inspect repository structure, package manager, runtime versions, existing conventions, tests, and deployment assumptions.
3. Summarize the current implementation, gaps relevant to the task, proposed plan, files likely to change, and risks.
4. Ask a concise question if a missing decision blocks safe implementation. Otherwise choose the simplest reversible approach and document the assumption.
5. Do not rewrite unrelated code or generate the entire product in one response.

## Product and Scope Rules
- Prioritize the MVP: store onboarding; secure owner access; products; size/color variants; stock; public storefront; cart; order processing; basic discounts.
- Keep custom domains, bulk imports, courier integrations, advanced analytics, automated messaging and other P1 features out until approved.
- Use mobile-first UX with accessible labels, keyboard support, clear loading/empty/error/success states and useful form validation.
- Sellers must be able to perform routine catalog, price, stock and discount changes themselves.
- Never describe a proposed differentiation as proven without customer evidence.

## Architecture Rules
- Prefer a modular monolith for the initial team and scale only when evidence justifies it.
- Keep controllers thin; isolate business rules in services/domain modules; validate all input at API boundaries.
- Keep configuration and secrets outside source control. Provide safe .env.example placeholders.
- Use consistent API response/error contracts and document endpoints (OpenAPI where practical).
- Use database indexes based on query patterns and validate with explain plans.
- Use integer minor units for money (paise for INR); persist order item and price/discount snapshots.
- Store product images in object storage/CDN, not in MongoDB document blobs.
- Add dependencies only when there is a clear need; explain trade-offs before introducing major infrastructure.

## Authentication and Security Rules
- For the browser seller dashboard, prefer server-side sessions with a high-entropy opaque session ID in a cookie, stored in a production-compatible shared session store.
- Cookie should be HttpOnly, Secure in production, and use a deliberate SameSite, Path, Domain, idle timeout and absolute lifetime policy.
- Never use Express MemoryStore in production. Rotate the session ID after login and privilege changes; invalidate it server-side on logout.
- Implement a documented CSRF defense for state-changing cookie-authenticated requests. Use strict CORS allowlists; never use wildcard origins with credentialed requests.
- Do not store session IDs or auth tokens in localStorage. Do not log cookies, passwords, tokens, payment secrets or unnecessary personal data.
- Hash passwords with a maintained, appropriately configured password-hashing library. Add rate limits for login, password reset, checkout and other abuse-prone endpoints.
- Enforce authorization on the server. Frontend route guards are UX only, not security.
- Tenant isolation is mandatory: every tenant-owned read/write/export must be scoped to the authenticated user's authorized store. Do not trust a client-supplied store ID as proof of authorization.
- Add tests for cross-tenant IDOR, role escalation, CSRF behavior, invalid uploads, and unauthorized order access.
- Verify payment webhook signatures using the provider's documented requirements. Never trust a browser redirect or client flag as payment proof.

## Data and Transaction Rules
- Define unique indexes and data ownership explicitly (store slug, membership, SKU, public order number, provider event ID as applicable).
- Revalidate product price, discount eligibility and stock on the server at checkout.
- Prevent overselling with atomic conditional updates or a correctly designed transaction/reservation workflow.
- Use idempotency for checkout/order creation and payment webhook processing.
- Model order/payment state transitions explicitly; reject invalid transitions.
- Define cancellation, stock restoration, COD collection, refund and reconciliation behavior before enabling production payments.
- Avoid destructive schema changes without a migration/backfill and rollback plan.
- Do not hard-delete records needed for financial/audit history without an explicit retention policy.

## Engineering Quality Rules
- Add unit tests for pricing, discounts, state transitions and permissions.
- Add integration tests for API, session behavior, database updates, tenant isolation and webhooks.
- Add end-to-end tests for the critical path: seller login → product publish → customer checkout → seller fulfills order.
- Add concurrency tests for last-item checkout, duplicate checkout, coupon limits and duplicate webhooks where relevant.
- Ensure lint, formatting, type checks and tests run in CI.
- Handle errors safely; no stack traces or secrets in client responses.
- Add structured logs and request IDs; do not log sensitive data.
- Include accessible, responsive UI and explicit loading, empty, validation and failure states.
- Update docs, API examples, environment variable lists and operational runbooks with each relevant change.

## Git and Delivery Rules
- Work on a focused branch/PR and keep the diff scoped to one feature.
- Never commit .env, credentials, real customer data, payment payloads with PII, private keys or production backups.
- PR summary must include: problem, implementation, changed files, tests/commands run and results, risks, migration/deployment notes, and manual QA steps.
- Do not claim tests passed unless actually executed. If tests could not be run, say why and list exact commands.
- A feature is not done merely because it works in the developer's browser.

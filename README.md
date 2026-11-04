# UniVerse Super App MVP

Multi-role marketplace starter with Customer, Seller, Delivery Partner and Admin portals, a shared Node.js API and SQLite database.

## Portals
- Customer website: `/`
- Seller portal: `/seller`
- Delivery partner portal: `/delivery`
- Legacy partner/cab portal: `/partner`
- Admin panel: `/admin`
- Health check: `/health`

## Local run
Requires Node.js 22.13+ (uses built-in `node:sqlite`). Run `npm start` and open `http://localhost:3000`.

Development admin default: `admin@universe.app` / `Admin@12345`. Change this immediately and set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `JWT_SECRET` before deployment.

## Marketplace flow
1. Seller registers at `/seller`; admin approves the seller in Admin > Seller Approvals.
2. Seller adds products; product ownership is stored in `products.seller_id`.
3. Customer checkout creates one parent `orders` row and one `seller_orders` row per seller. Product snapshots are stored in `seller_order_items`.
4. Each seller only sees their own sub-orders and can Accept, Reject, Start Preparing, and Ready for Pickup.
5. Ready seller orders create delivery assignments. Approved online delivery partners see and accept individual seller pickup jobs.
6. Delivery partner verifies pickup OTP, then verifies customer delivery OTP. Seller and partner ledgers are updated after delivery.

## Key APIs
- Auth/customer: `/api/signup`, `/api/login`, `/api/me`, `/api/products`, `/api/orders`
- Seller: `/api/sellers/signup`, `/api/seller/profile`, `/api/seller/products`, `/api/seller/orders`, `/api/seller/earnings`
- Seller order actions: `/api/seller/orders/:id/accept|reject|preparing|ready`
- Delivery: `/api/delivery/jobs`, `/api/delivery/jobs/:id/accept`, `/api/delivery/jobs/:id/pickup`, `/api/delivery/jobs/:id/deliver`
- Admin: `/api/admin/sellers`, `/api/admin/sellers/:id/approve`, `/api/admin/marketplace-orders`, `/api/admin/stats`
- Payments and finance: `/api/payments/*`, `/api/refunds` (provider configuration required), `/api/admin/payouts`, `/api/admin/reconciliation`

## Android + website
The web portals are responsive and include a PWA manifest/service worker. On Android Chrome, open the HTTPS website and choose **Install app** / **Add to Home screen**. See `ANDROID_BUILD_GUIDE.md` for Capacitor steps to create an Android Studio wrapper and signed AAB. This ZIP does not contain a signed APK/AAB.

## Environment
Copy `.env.example` into your deployment secret manager / local environment. Configure `PORT`, `DATA_DIR`, `NODE_ENV`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SELLER_COMMISSION_PERCENT`, `PARTNER_DELIVERY_EARNING`, Razorpay and RazorpayX credentials/webhook secrets as needed. Never commit `.env` or provider secrets.

## Deploy on Render (pilot)
1. Push this folder to a private GitHub repository.
2. Create a Node Web Service with start command `npm start`.
3. Attach a persistent disk and set `DATA_DIR=/data`.
4. Configure strong admin credentials and a random JWT secret.
5. Set HTTPS domain, payment webhook URLs, provider credentials and backup monitoring.
6. Test in sandbox before enabling live payment/payout credentials.

## Limitations before public production launch
- Demo OTPs are returned/displayed only outside `NODE_ENV=production`; production requires SMS/WhatsApp OTP provider integration. No OTP is delivered automatically by this ZIP.
- Existing Razorpay Standard Checkout hooks require merchant onboarding, keys and webhook configuration. Live payment/refund behaviour has not been tested here.
- Partner payout integration is present in the earlier finance module, but a complete seller bank onboarding and seller payout workflow still needs implementation and provider approval.
- COD collection/reconciliation is manual; COD settlement automation is not implemented.
- Seller rejection restocks the rejected items; partial online-payment refunds for a rejected seller sub-order need a provider-backed implementation.
- No live GPS tracking, maps routing, push notifications, image upload service, seller document verification or production KYC provider is included.
- SQLite is suitable for local/demo or a tightly scoped single-instance pilot. For scale/multi-instance production, migrate to managed PostgreSQL and object storage.
- Complete security/load testing, privacy/terms, GST/FSSAI and marketplace legal review before public launch.

## Test report
See `TEST_REPORT.md`. The tested local demo workflow covers two sellers in one customer cart, seller isolation, seller status progression, two delivery jobs, pickup OTP and delivery OTP. It does not certify production readiness.

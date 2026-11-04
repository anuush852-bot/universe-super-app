# UniVerse Android + Website Setup

## What is included
- Responsive customer website at `/`
- Seller portal at `/seller`
- Delivery partner portal at `/delivery`
- Existing partner/cab portal at `/partner`
- Admin portal at `/admin`
- PWA manifest + service worker. On Android Chrome, open the deployed HTTPS site, tap browser menu, then **Install app** / **Add to Home screen**.

This package is an installable PWA, not a signed APK/AAB. To publish a native Android wrapper, use Capacitor after deploying the HTTPS website:

```bash
npm install
npm install @capacitor/core @capacitor/cli
npx cap init "UniVerse Super App" "com.universe.superapp" --web-dir public
npx cap add android
```

For a web-hosted backend/frontend setup, configure Capacitor's `server.url` to your HTTPS customer site in `capacitor.config.json` (and allow the required host in Android network/security settings), then:

```bash
npx cap sync android
npx cap open android
```

Build a signed Android App Bundle (AAB) in Android Studio for Play Console. Create separate Android packages / app identities if you later publish Customer, Seller and Delivery as separate apps. Do not put secrets in the Android client.

## Local run
Requires Node.js 22.13+ because this project uses Node's built-in `node:sqlite`.

```bash
npm start
```

Open `http://localhost:3000`, `/seller`, `/delivery`, `/admin`.

Default local admin account (development only):
- Email: `admin@universe.app`
- Password: `Admin@12345`

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and a long random `JWT_SECRET` before any shared/staging/production deployment. Change the default credentials immediately.

## Seller workflow
1. Seller registers at `/seller`.
2. Admin logs into `/admin` and approves the seller.
3. Approved seller adds products; each product is saved with its owner `seller_id`.
4. Customer checks out. Products are grouped by seller into separate `seller_orders` under one parent order.
5. Each seller sees only their own seller orders and can Accept, Reject, Start Preparing, and Ready for Pickup.
6. Ready orders create delivery assignments.
7. Approved delivery partner goes online at `/delivery`, accepts a pickup, verifies pickup OTP, then verifies the customer's delivery OTP.
8. Seller and delivery earnings are recorded in ledgers when delivery is completed.

## Environment variables
Copy `.env.example` to `.env` in your deployment environment (do not commit secrets):
- `PORT`, `DATA_DIR`, `JWT_SECRET`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `SELLER_COMMISSION_PERCENT` (default 10)
- `PARTNER_DELIVERY_EARNING` (default 30)
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `RAZORPAYX_KEY_ID`, `RAZORPAYX_KEY_SECRET`, `RAZORPAYX_ACCOUNT_NUMBER`, `RAZORPAYX_WEBHOOK_SECRET`, `PAYOUT_AUTO_THRESHOLD`

The existing payment/payout provider integration only works after provider account onboarding, keys, webhook configuration, KYC and live testing. Do not use test keys for real payments.

## Important production work still required
- Replace demo OTP display with an SMS/WhatsApp OTP provider. Development mode displays demo OTPs for testing; production deliberately suppresses them.
- Configure provider-backed seller/partner KYC, seller bank/fund accounts and seller payout workflow. Current payout flow is primarily partner-oriented.
- Configure COD cash collection/reconciliation and seller settlements.
- Add address/geocoding, route distance, real-time tracking, push notifications and customer support integrations.
- Add secure image uploads/object storage, audit/retention policy, backups, monitoring, rate limiting at edge, HTTPS and security review.
- Review GST, FSSAI (food sellers), consumer protection, privacy and payment aggregator/marketplace obligations with qualified professionals.
- SQLite is suitable for a local MVP/demo. For a multi-instance production launch, migrate to managed PostgreSQL and use durable object storage. Ensure the host's persistent disk is configured if SQLite is used during pilot.

## Security notes
- Passwords are scrypt-hashed and API sessions are signed tokens.
- Admin and seller ownership checks are enforced on seller product/order APIs.
- Never expose OTPs, KYC documents, bank data, API keys or payment secrets in logs or client responses in production.
- Development demo OTPs are intentionally available only when `NODE_ENV` is not `production`.

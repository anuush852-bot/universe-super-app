# UniVerse Super App – Payments, Delivery OTP, Earnings & Settlements

## What this update adds

- Customer online checkout using Razorpay Standard Checkout (requires live/test credentials).
- Server-side Razorpay payment signature verification and payment webhook.
- Delivery OTP generated for each order; customer sees it after placing the order. Partner must enter the 6-digit OTP before delivery completion.
- Partner earning is credited once only after OTP verification; duplicate completion requests cannot double-credit.
- Automatic RazorpayX payout attempt after a completed job when the partner has a verified payout profile and balance reaches `PAYOUT_AUTO_THRESHOLD` (default ₹500).
- Payout webhook status updates. Failed/reversed/cancelled payouts return the amount to the partner's earnings balance, allowing a later retry.
- Online order cancellation before pickup requests a Razorpay refund. Wallet orders are credited back to the customer wallet.
- Seller commission ledger calculation for products whose `seller_id` is populated; default commission is `SELLER_COMMISSION_PERCENT` (10%).
- Admin reconciliation API: `/api/admin/reconciliation` (payments, refunds, payouts, commissions).
- SQLite schema migrations are automatic; persistent data folder is created if missing.

## Important limitations before public launch

This is an integration-ready code update, not a substitute for provider onboarding. Real payments and bank transfers remain disabled until the business has approved Razorpay/RazorpayX accounts and secrets are configured in hosting. Never use live keys in source code or GitHub.

RazorpayX fund accounts must be created through an approved KYC/onboarding process. This code deliberately does not collect or store raw bank account numbers, IFSC, Aadhaar, PAN, or face biometrics. After provider verification, an authorized admin must attach the provider's `fund_account_id` to the partner profile using the admin API. Do not mark KYC verified unless the provider confirms it.

Partner earnings are held in the app's internal ledger until the payout threshold is reached. The default automatic payout threshold is ₹500. Change it only after reviewing payout costs and cash-flow rules.

Seller commission rows are generated only when the purchased product has a valid `seller_id`. The current MVP still needs the full Seller signup/dashboard and product ownership workflow before seller settlements can be enabled. No seller bank payout is implemented in this release.

The delivery OTP is shown to the customer in the order confirmation screen. For production, integrate an approved SMS/WhatsApp/push provider so the customer can retrieve it reliably. Do not show the OTP in the partner app or admin order list.

The existing wallet top-up is demo-only and remains disabled in production. Do not treat this customer wallet as a regulated stored-value/PPI wallet. Obtain legal/payment-provider advice for the chosen marketplace and settlement model.

## Local setup

1. Install Node.js 22.13 or newer.
2. Extract the ZIP.
3. Copy `.env.example` to `.env` for local development and fill only test credentials.
4. Run `node server.js` from the project folder.
5. Open `http://localhost:3000`, `http://localhost:3000/partner`, and `http://localhost:3000/admin`.
6. Use the admin email/password supplied in environment variables. Change the default credentials immediately.

## Render deployment

1. Push this project to a private GitHub repository.
2. Create a Render Web Service from the repository; build command can remain blank and start command is `node server.js`.
3. Attach a persistent disk mounted at `/data`.
4. Add environment variables from `.env.example` in Render Environment. Set `DATA_DIR=/data`, `NODE_ENV=production`, a unique `JWT_SECRET`, and strong admin credentials.
5. Add Razorpay test keys first. Add webhook URL `https://YOUR_DOMAIN/api/webhooks/razorpay` in Razorpay with the exact webhook secret stored as `RAZORPAY_WEBHOOK_SECRET`.
6. Test UPI/card payment, signature verification, cancellation/refund and reconciliation using test mode.
7. Apply for RazorpayX and complete business and beneficiary KYC. Configure payout keys, account number and webhook URL `https://YOUR_DOMAIN/api/webhooks/razorpayx`.
8. After provider KYC verification, save the verified provider `fund_account_id` for each partner through the admin endpoint. Do not manually invent a fund account ID.
9. Test payouts with a low-value test beneficiary before enabling automatic settlements.
10. Only after reconciliation and legal review, switch to live credentials.

## API routes added

- `POST /api/payments/create-order` – create Razorpay order for an unpaid UniVerse order.
- `POST /api/payments/verify` – verify Razorpay Checkout signature.
- `POST /api/webhooks/razorpay` – verify payment/refund webhook signature.
- `GET /api/partner/payout-profile` – partner payout/KYC status.
- `POST /api/partner/payout-profile` – starts a placeholder profile submission; provider onboarding must be configured separately.
- `POST /api/partner/payout-request` – manual payout request/retry when eligible.
- `GET /api/partner/payouts` – partner payout history.
- `POST /api/webhooks/razorpayx` – payout status webhook.
- `POST /api/admin/partners/:id/payout-profile` – admin attaches provider-issued fund account ID and KYC status after external verification.
- `GET /api/admin/payouts` – payout and seller commission listing.
- `GET /api/admin/reconciliation` – payment/refund/payout/commission reconciliation.

## Delivery test

1. Create a customer and a delivery partner account.
2. Admin approves partner; partner goes online.
3. Customer places a COD or paid test order.
4. Customer receives a 6-digit delivery OTP on the confirmation screen.
5. Partner accepts the order and presses Mark Delivered.
6. Enter an incorrect OTP first; server must reject it.
7. Enter the correct OTP; order becomes Delivered and the partner earning is credited exactly once.
8. If the partner is KYC-verified and balance is at least the auto threshold, a RazorpayX payout is initiated. Otherwise earnings remain in the partner ledger.

## Production go-live checklist

- [ ] Business and marketplace model reviewed by CA/legal advisor.
- [ ] GST, FSSAI and any category-specific licences checked.
- [ ] Razorpay account approved and live payment keys configured.
- [ ] Razorpay webhook signatures tested.
- [ ] RazorpayX account approved and live payout credentials configured.
- [ ] Partner KYC and fund-account onboarding verified by provider.
- [ ] SMS/push OTP delivery provider integrated.
- [ ] Refund, cancellation, failed payout and reversal scenarios tested.
- [ ] Daily bank/payment reconciliation process assigned to an employee.
- [ ] Persistent database disk, backups, monitoring and alerts enabled.
- [ ] Default admin credentials changed; secrets never committed to GitHub.
- [ ] Seller portal and seller settlement workflow completed before onboarding third-party sellers.

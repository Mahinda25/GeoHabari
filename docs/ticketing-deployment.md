# Ticketing deployment

## Domain routing

- Keep the WordPress site on `https://geohabari.com`.
- Deploy this ticketing application at `https://tickets.geohabari.com`.
- Set `PUBLIC_WORDPRESS_URL` to the WordPress origin and `PUBLIC_TICKETING_URL` and `PUBLIC_SITE_URL` to the ticketing origin.
- Ticketing event links should point to `tickets.geohabari.com`; WordPress navigation and admin sign-out should return to the public WordPress home.

## Paystack payments

Set these environment variables in the server deployment:

| Variable | Required | Purpose |
| --- | --- | --- |
| `PAYSTACK_SECRET_KEY` | Yes | Server-only Paystack secret (`sk_test_...` for testing, `sk_live_...` for production). Never use a `PUBLIC_` prefix. |
| `PUBLIC_SITE_URL` | Yes | Ticketing site origin, for example `https://tickets.geohabari.com`. |
| `RESEND_API_KEY` | No | Sends ticket confirmation and codes by email after verified payment. Missing or failed email delivery does not block checkout or undo a verified payment; configure it and use **Resend tickets** in the admin order ledger to retry. |
| `RESEND_FROM` | Optional | Verified sender address; defaults to `noreply@geohabari.com`. |

No Paystack key is exposed to browser code. The server initializes each KES transaction with a unique order reference and enables both `mobile_money` and `card` channels. The browser resumes Paystack's secure popup with its short-lived access code. Neither the popup callback nor the redirect issues tickets: the server verifies the transaction reference, status, KES amount, and channel with Paystack first. A verified webhook is also required for asynchronous updates; duplicate events use the same order reference and do not issue duplicate tickets.

In the Paystack dashboard, configure this webhook URL:

`https://tickets.geohabari.com/api/payments/paystack`

The handler validates Paystack's `x-paystack-signature` as an HMAC-SHA512 of the exact raw request body, then calls the Verify Transaction API before processing successful, failed, or abandoned charges.

### Test mode

1. Use a Paystack **test** secret key in `PAYSTACK_SECRET_KEY` and configure the test-mode webhook URL above. Do not use a live secret in local development.
2. Buy a ticket with a test card. Paystack's [test payment guide](https://paystack.com/docs/payments/test-payments/) lists successful card data, including `4084 0840 8408 4081` (future expiry, CVV `408`), plus cards for declined-payment scenarios.
3. To exercise the M-Pesa/mobile-money channel, select Kenya and use the Paystack test number `+254 710 000 000` with the `M-Pesa` network in Paystack's test checkout. This test number is documented in Paystack's [test payment guide](https://paystack.com/docs/payments/test-payments/). No real M-Pesa charge should be made in test mode.
4. Confirm that the success page remains pending until Paystack verifies the transaction, then changes to confirmed after verification/webhook delivery. Confirm that failed or abandoned attempts issue no tickets. In the Paystack dashboard, use the test webhook tools to retry an event and confirm there is still only one set of ticket codes.

## Buyer contact and ticket delivery

Checkout stores one buyer's name, email, and phone for the whole order. Phone numbers are normalized to E.164. East African phone entries use Kenya `+254`, Uganda `+256`, Tanzania `+255`, Rwanda `+250`, Burundi `+257`, South Sudan `+211`, Ethiopia `+251`, and Somalia `+252`. Ethiopia's international prefix is `+251`; `+252` is Somalia's prefix.

M-Pesa is offered only for supported Safaricom Kenya mobile prefixes. Other valid East African numbers remain available as contact details and are directed to card checkout.

WhatsApp delivery uses the WhatsApp Business Cloud API and is optional until configured. Set:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_TICKET_TEMPLATE` — an approved template with one body text placeholder, such as `{{1}}`.
- `WHATSAPP_TEMPLATE_LANGUAGE` — optional; defaults to `en`.

After payment is verified, the ticket codes and order details are included in that approved template message to the buyer's E.164 number. WhatsApp send failures are logged and do not reverse a paid order or block email delivery.

## Student verification

Student verification requires `VERIFICATION_TOKEN_SECRET`. University-email verification and email ticket delivery require `RESEND_API_KEY`; its absence does not prevent ticket checkout or issuance after payment. Google Vision document OCR additionally requires `OCR_PROVIDER=google` and `GOOGLE_VISION_API_KEY`. If OCR or its credentials are unavailable, uploaded IDs are not approved automatically; students can use university-email verification or select another ticket category.

## Session sign-out

Admin sign-out is available at `/api/admin/logout`. The endpoint revokes the server-side session, expires the HTTP-only auth cookie, and sends the browser to the configured public home. Authenticated admin responses use `no-store` headers and reload if restored from the browser back-forward cache.

## Supabase persistence

Ticketing data (events, ticket types, orders, payments, tickets, student verifications, admin sessions, audit logs, login attempts, and exports) is stored in Supabase through the shared server-side client. Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the server deployment; never expose the service-role key to browser code.

Apply the migrations in `supabase/migrations/` in timestamp order, including `20261026_supabase_ticketing_runtime.sql`. The runtime migration creates or extends the tables used by the application and installs the atomic order-reservation and payment-confirmation RPCs. Ticket prices and order amounts are integer KES values. Private student documents are stored in the private Supabase Storage bucket, not on the server filesystem.

The migration does not import historical records from a former local JSON store. If there are records that exist only in that file, import them into the corresponding Supabase tables before relying on them in production.

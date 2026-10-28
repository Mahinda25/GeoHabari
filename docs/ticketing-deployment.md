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
| `RESEND_API_KEY` | No | Sends ticket confirmation and codes by email after verified payment. Missing or failed email delivery does not block checkout or undo a verified payment; configure it and use **Verify & Resend Ticket** in the admin order ledger to retry. |
| `RESEND_FROM` | Optional | Must be `GeoHabari Tickets <tickets@tickets.geohabari.com>` for ticket confirmations. |

No Paystack key is exposed to browser code. The server validates the checkout against Supabase, generates a unique reference, and atomically inserts a `pending` order and payment before initializing a KES transaction with the supported `mobile_money` and `card` channels. The pending order reserves ticket capacity for 20 minutes. The webhook and the success-page poll both verify the transaction with Paystack, then call the same atomic Supabase fulfillment RPC. Verified successes update the order and payment to `paid` and issue tickets. A verified failed transaction may cancel the order; an abandoned verification cancels only after the reservation expires. Unresolved provider responses, modal dismissal, and temporary network errors leave the order pending. Cancelled orders are re-verified so a late confirmed success can still fulfill the order. The atomic fulfillment RPC prevents duplicate ticket issuance.

In the Paystack dashboard, configure this canonical webhook URL:

`https://tickets.geohabari.com/api/paystack/webhook`

The canonical and legacy webhook routes validate Paystack's `x-paystack-signature` as an HMAC-SHA512 of the exact raw request body, then call the Verify Transaction API for successful charges. Non-success webhook events are acknowledged without changing database state; the verification API remains the source of truth for failed or abandoned attempts. The browser polling endpoint can recover a successful payment if the webhook is delayed or missed. Confirmation emails use a stable Resend idempotency key, and email success or failure is recorded in audit logs separately from payment status. Admins can use **Verify & Resend Ticket** on the order ledger to reconcile pending orders or retry delivery for paid orders.

### Test mode

1. Use a Paystack **test** secret key in `PAYSTACK_SECRET_KEY` and configure the test-mode webhook URL above. Do not use a live secret in local development.
2. Buy a ticket with a test card. Paystack's [test payment guide](https://paystack.com/docs/payments/test-payments/) lists successful card data, including `4084 0840 8408 4081` (future expiry, CVV `408`), plus cards for declined-payment scenarios.
3. To exercise the M-Pesa/mobile-money channel, select Kenya and use the Paystack test number `+254 710 000 000` with the `M-Pesa` network in Paystack's test checkout. This test number is documented in Paystack's [test payment guide](https://paystack.com/docs/payments/test-payments/). No real M-Pesa charge should be made in test mode.
4. Confirm the success page continues polling while Paystack is unresolved, then changes to confirmed and displays issued ticket information. Confirm that failed or abandoned attempts create cancelled/failed records only when explicitly verified, and do not issue tickets. In the Paystack dashboard, use the test webhook tools to retry a successful event and confirm there is still only one set of ticket codes.

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

Apply the migrations in `supabase/migrations/` in timestamp order, including `20261026_supabase_ticketing_runtime.sql`, `20261027_update_payments_schema.sql`, `20261027211200_no_pending_checkout.sql`, and `20261028010000_restore_pending_checkout_reservations.sql`. The latest migrations provide the atomic Paystack reservation and fulfillment RPCs; the reservation RPC must be executable only by `service_role`. Pending reservations expire after 20 minutes. Ticket prices and order amounts are integer KES values. Private student documents are stored in the private Supabase Storage bucket, not on the server filesystem.

The migration does not import historical records from a former local JSON store. If there are records that exist only in that file, import them into the corresponding Supabase tables before relying on them in production.

# Testing Paystack webhooks locally

The local webhook endpoint is `/api/payments/paystack`. To receive Paystack test
notifications while Astro is running on port `4321`:

1. Start the app with `npm run dev`.
2. Install and authenticate the ngrok CLI using the instructions on
   [ngrok's official site](https://ngrok.com/download). Keep the ngrok
   authentication token out of the repository and chat logs.
3. In a separate terminal, run `ngrok http 4321`.
4. Copy the HTTPS forwarding address shown by ngrok and configure the Paystack
   test webhook URL as
   `https://<ngrok-host>/api/payments/paystack`.
5. Trigger a test payment or webhook from Paystack. The route validates
   `x-paystack-signature` using the server-side `PAYSTACK_SECRET_KEY` and then
   independently verifies the transaction with Paystack before fulfillment.

Use test credentials and stop the tunnel when testing is finished. A tunnel
exposes the local Astro server publicly while it is running; do not use
production credentials or leave it running unnecessarily.

Webhook request bodies are not written to local files. The route only logs
processing errors, so payment and buyer data are not persisted to an ad hoc
payload file.

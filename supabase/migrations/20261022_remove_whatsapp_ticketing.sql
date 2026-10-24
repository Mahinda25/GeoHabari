-- Retire the unapproved WhatsApp notification feature without changing order,
-- payment, ticket, or student-verification records.
DROP INDEX IF EXISTS idx_whatsapp_notifications_status;
DROP INDEX IF EXISTS idx_whatsapp_notifications_phone;
DROP TABLE IF EXISTS whatsapp_notifications;

ALTER TABLE IF EXISTS orders
  DROP COLUMN IF EXISTS whatsapp_opt_in,
  DROP COLUMN IF EXISTS whatsapp_opt_in_at;

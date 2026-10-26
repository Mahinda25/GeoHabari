# Ticketing Supabase runtime

The Astro server uses the existing Supabase JS client for ticketing tables and Storage. Configure these server-side environment variables in local development and Vercel:

```dotenv
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_POSTER_BUCKET=event-posters
SUPABASE_PRIVATE_DOCUMENT_BUCKET=student-documents
```

`SUPABASE_SERVICE_ROLE_KEY` is privileged: never prefix it with `PUBLIC_`, put it in browser code, or expose it through a public API. The shared client in `src/lib/supabase.js` only reads the service-role key from the server environment.

Apply the existing migrations in `supabase/migrations/` in timestamp order, including `20261026_supabase_ticketing_runtime.sql`. That migration adds runtime columns and `ticket_exports`, creates the public poster and private student-document buckets, and installs database RPCs for atomic order reservation and payment confirmation/ticket issuance. The RPCs require the Supabase `service_role`.

Poster URLs are public through the `event-posters` bucket. Student ID documents are kept in the non-public `student-documents` bucket and are read/deleted only from authenticated server routes. No server-side local upload directory is used.

The migration creates the database schema but does not import historical rows or file bytes from the former local JSON store. Before production cutover, import any records that exist only in that JSON file and copy any existing student documents into `student-documents/student-ids/`, keeping each verification record's `document_storage_key` aligned with its object path. Existing bare UUID filenames are interpreted as `student-ids/<filename>` for storage reads/deletes. Poster files also need to be uploaded into `event-posters/posters/` and their event URLs updated. Do not run the old local-store tests against the production database.

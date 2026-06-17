# Sprint 3 Backend Setup

This backend sprint adds report exports, improved Gemini analysis, LemonSqueezy billing, generated report storage, and readiness checks.

## Environment Variables

Required core settings:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
SUPABASE_STORAGE_BUCKET=raw-csv
GENERATED_REPORTS_BUCKET=generated-reports
BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

AI pipeline:

```env
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
GOOGLE_GEMINI_MODEL=gemini-2.5-flash-20240606
```

LemonSqueezy billing:

```env
LEMONSQUEEZY_API_KEY=...
LEMONSQUEEZY_STORE_ID=...
LEMONSQUEEZY_VARIANT_ID=...
LEMONSQUEEZY_WEBHOOK_SECRET=...
APP_FRONTEND_URL=http://localhost:5173
```

## Supabase Setup

Create these private Storage buckets:

- `raw-csv` for source uploads.
- `generated-reports` for generated PDF/DOCX exports.

For Sprint 3.1, apply the non-destructive LemonSqueezy patch only if `provider` or `renewal_at` is missing:

```sql
server/migrations/004_sprint_3_1_lemonsqueezy_subscriptions_patch.sql
```

The patch assumes `public.subscriptions` already exists and does not create new tables.

## Report Exports

Endpoints:

- `GET /api/organizations/{organization_id}/reports/{report_id}/export/pdf`
- `GET /api/organizations/{organization_id}/reports/{report_id}/export/docx`

Both endpoints require organization membership. Generated files are uploaded to `generated-reports`, and the response includes a signed URL.

Export metadata is saved in `reports.report_json.exports`.

## Billing

Endpoints:

- `POST /api/billing/create-checkout`
- `POST /api/billing/webhook`
- `GET /api/billing/current-plan?organization_id=...`

Only organization owners/admins can create checkout sessions. Any org member can read the current plan.

Configure the LemonSqueezy webhook to call:

```text
POST /api/billing/webhook
```

Required event:

```text
subscription_created
subscription_updated
subscription_cancelled
```

When a subscription is active, the backend upserts `subscriptions` and sets `organizations.plan` to `pro`.
When a subscription is cancelled, it sets `organizations.plan` to `free`.

## Health Checks

- `/health` confirms the app process is alive.
- `/health/ready` reports whether Supabase, storage buckets, Gemini, and LemonSqueezy settings are present.

## Verification

Run:

```bash
python -m pytest -q
```

Manual smoke checks:

- Start FastAPI.
- Verify `/health` and `/health/ready`.
- Upload a CSV and wait for a completed report.
- Export PDF and DOCX from the completed report.
- Create a LemonSqueezy checkout for an owner/admin account.

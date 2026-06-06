# Sprint 3 Backend Setup

This backend sprint adds report exports, improved Gemini analysis, Stripe billing, generated report storage, and readiness checks.

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

Stripe billing:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
APP_FRONTEND_URL=http://localhost:5173
```

## Supabase Setup

Create these private Storage buckets:

- `raw-csv` for source uploads.
- `generated-reports` for generated PDF/DOCX exports.

Apply the non-destructive migration:

```sql
server/migrations/003_sprint_3_subscriptions.sql
```

The migration creates `subscriptions` only if it does not already exist and adds org-scoped RLS policies.

## Report Exports

Endpoints:

- `GET /api/organizations/{organization_id}/reports/{report_id}/export/pdf`
- `GET /api/organizations/{organization_id}/reports/{report_id}/export/docx`

Both endpoints require organization membership. Generated files are uploaded to `generated-reports`, and the response includes a signed URL.

Export metadata is saved in `reports.report_json.exports`.

## Billing

Endpoints:

- `POST /api/billing/create-checkout-session`
- `POST /api/billing/webhook`
- `GET /api/billing/current-plan?organization_id=...`

Only organization owners/admins can create checkout sessions. Any org member can read the current plan.

Configure the Stripe webhook to call:

```text
POST /api/billing/webhook
```

Required event:

```text
checkout.session.completed
```

When checkout succeeds, the backend upserts `subscriptions` and sets `organizations.plan` to `pro`.

## Health Checks

- `/health` confirms the app process is alive.
- `/health/ready` reports whether Supabase, storage buckets, Gemini, and Stripe settings are present.

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
- Create a Stripe Checkout session for an owner/admin account.

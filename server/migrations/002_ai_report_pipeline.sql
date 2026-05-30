-- Sprint 2 AI report pipeline support.
-- This migration extends the existing org-scoped reports model without removing Sprint 1 columns.

alter table public.reports
  add column if not exists project_id uuid,
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'uploading', 'processing', 'completed', 'failed')),
  add column if not exists progress int not null default 0 check (progress >= 0 and progress <= 100),
  add column if not exists current_step text,
  add column if not exists file_url text,
  add column if not exists file_name text,
  add column if not exists file_type text,
  add column if not exists report_json jsonb,
  add column if not exists error_message text;

create index if not exists reports_status_idx on public.reports(status);
create index if not exists reports_user_id_idx on public.reports(user_id);
create index if not exists reports_org_status_created_idx on public.reports(organization_id, status, created_at desc);

create table if not exists public.report_jobs (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  job_type text not null,
  status text not null default 'processing' check (status in ('queued', 'processing', 'completed', 'failed')),
  progress int not null default 0 check (progress >= 0 and progress <= 100),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  logs jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists report_jobs_report_id_idx on public.report_jobs(report_id);
create index if not exists report_jobs_status_idx on public.report_jobs(status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_report_jobs_updated_at on public.report_jobs;
create trigger set_report_jobs_updated_at
before update on public.report_jobs
for each row execute function public.set_updated_at();

alter table public.report_jobs enable row level security;

drop policy if exists "Org members can read report jobs" on public.report_jobs;
create policy "Org members can read report jobs"
on public.report_jobs
for select
using (
  exists (
    select 1
    from public.reports r
    where r.id = report_jobs.report_id
      and public.is_org_member(r.organization_id)
  )
);

drop policy if exists "Org members can insert report jobs" on public.report_jobs;
create policy "Org members can insert report jobs"
on public.report_jobs
for insert
with check (
  exists (
    select 1
    from public.reports r
    where r.id = report_jobs.report_id
      and public.is_org_member(r.organization_id)
  )
);

drop policy if exists "Org members can update report jobs" on public.report_jobs;
create policy "Org members can update report jobs"
on public.report_jobs
for update
using (
  exists (
    select 1
    from public.reports r
    where r.id = report_jobs.report_id
      and public.is_org_member(r.organization_id)
  )
)
with check (
  exists (
    select 1
    from public.reports r
    where r.id = report_jobs.report_id
      and public.is_org_member(r.organization_id)
  )
);

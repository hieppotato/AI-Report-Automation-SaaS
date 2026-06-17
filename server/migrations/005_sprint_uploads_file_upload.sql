-- Sprint uploads file support (backend POST /uploads/file).
-- Non-destructive: safe to run if 001_sprint_1_backend_integration.sql was already applied.
-- Run in Supabase SQL editor or through your migration tool.

-- ---------------------------------------------------------------------------
-- Shared helper for org-scoped RLS policies
-- ---------------------------------------------------------------------------
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = org_id
      and om.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- uploads table
-- ---------------------------------------------------------------------------
create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  mime_type text,
  size_bytes bigint not null check (size_bytes >= 0),
  status text not null default 'uploaded'
    check (status in ('uploaded', 'processing', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Legacy schemas may have file_url instead of file_path.
alter table public.uploads
  add column if not exists file_name text,
  add column if not exists file_path text,
  add column if not exists file_url text,
  add column if not exists mime_type text,
  add column if not exists file_type text,
  add column if not exists size_bytes bigint,
  add column if not exists status text default 'uploaded',
  add column if not exists uploaded_by uuid references auth.users(id) on delete cascade,
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.uploads
set file_path = file_url
where file_path is null
  and file_url is not null;

update public.uploads
set file_url = file_path
where file_url is null
  and file_path is not null;

update public.uploads
set mime_type = file_type
where mime_type is null
  and file_type is not null;

update public.uploads
set file_type = mime_type
where file_type is null
  and mime_type is not null;

update public.uploads
set status = 'uploaded'
where status is null;

create index if not exists uploads_organization_id_idx
  on public.uploads(organization_id);

create index if not exists uploads_uploaded_by_idx
  on public.uploads(uploaded_by);

create index if not exists uploads_org_created_at_idx
  on public.uploads(organization_id, created_at desc);

create index if not exists uploads_status_idx
  on public.uploads(status);

-- ---------------------------------------------------------------------------
-- Link reports -> uploads (used by report file upload flow)
-- ---------------------------------------------------------------------------
alter table public.reports
  add column if not exists upload_id uuid references public.uploads(id) on delete set null;

create index if not exists reports_upload_id_idx
  on public.reports(upload_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_uploads_updated_at on public.uploads;
create trigger set_uploads_updated_at
before update on public.uploads
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security (client reads; backend service role bypasses RLS)
-- ---------------------------------------------------------------------------
alter table public.uploads enable row level security;

drop policy if exists "Org members can read uploads" on public.uploads;
create policy "Org members can read uploads"
on public.uploads
for select
using (public.is_org_member(organization_id));

drop policy if exists "Org members can insert uploads" on public.uploads;
create policy "Org members can insert uploads"
on public.uploads
for insert
with check (
  public.is_org_member(organization_id)
  and uploaded_by = auth.uid()
);

drop policy if exists "Org members can update uploads" on public.uploads;
create policy "Org members can update uploads"
on public.uploads
for update
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists "Org members can delete uploads" on public.uploads;
create policy "Org members can delete uploads"
on public.uploads
for delete
using (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- Storage bucket for backend uploads (SUPABASE_STORAGE_BUCKET=raw-csv)
-- Service role uploads bypass storage RLS; members can read their org files.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'raw-csv',
  'raw-csv',
  false,
  52428800,
  array[
    'text/csv',
    'application/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/pdf'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Org members can read raw-csv uploads" on storage.objects;
create policy "Org members can read raw-csv uploads"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'raw-csv'
  and public.is_org_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "Org members can delete raw-csv uploads" on storage.objects;
create policy "Org members can delete raw-csv uploads"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'raw-csv'
  and public.is_org_member(((storage.foldername(name))[1])::uuid)
);

-- Refresh PostgREST schema cache so new columns are visible to the API client.
notify pgrst, 'reload schema';

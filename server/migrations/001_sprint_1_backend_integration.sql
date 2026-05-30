-- Sprint 1 backend integration support.
-- Run in Supabase SQL editor or through your migration tool.

alter table public.profiles
  add column if not exists company_name text,
  add column if not exists timezone text;

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  mime_type text,
  size_bytes bigint not null check (size_bytes >= 0),
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists uploads_organization_id_idx on public.uploads(organization_id);
create index if not exists uploads_uploaded_by_idx on public.uploads(uploaded_by);
create index if not exists uploads_org_created_at_idx on public.uploads(organization_id, created_at desc);

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
with check (public.is_org_member(organization_id) and uploaded_by = auth.uid());

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

-- Patch uploads table columns required by POST /uploads/file.
-- Run this if you already applied 005 before mime_type columns were added,
-- or if uploads was created by an older schema.

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

notify pgrst, 'reload schema';

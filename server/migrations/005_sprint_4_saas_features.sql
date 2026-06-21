-- Sprint 4 SaaS production features.
-- Non-destructive: creates invitation and audit tables only if missing.

create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists organization_invitations_organization_id_idx
on public.organization_invitations(organization_id);

create index if not exists organization_invitations_email_idx
on public.organization_invitations(email);

create index if not exists organization_invitations_status_idx
on public.organization_invitations(status);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_organization_id_idx
on public.audit_events(organization_id);

create index if not exists audit_events_org_created_at_idx
on public.audit_events(organization_id, created_at desc);

create index if not exists audit_events_actor_id_idx
on public.audit_events(actor_id);

create index if not exists audit_events_action_idx
on public.audit_events(action);

alter table public.organization_invitations enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists "Org admins can read invitations" on public.organization_invitations;
create policy "Org admins can read invitations"
on public.organization_invitations
for select
using (
  exists (
    select 1 from public.organization_members om
    where om.organization_id = organization_invitations.organization_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
  )
);

drop policy if exists "Org admins can manage invitations" on public.organization_invitations;
create policy "Org admins can manage invitations"
on public.organization_invitations
for all
using (
  exists (
    select 1 from public.organization_members om
    where om.organization_id = organization_invitations.organization_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1 from public.organization_members om
    where om.organization_id = organization_invitations.organization_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
  )
);

drop policy if exists "Org members can read audit events" on public.audit_events;
create policy "Org members can read audit events"
on public.audit_events
for select
using (public.is_org_member(organization_id));

drop policy if exists "Org members can insert audit events" on public.audit_events;
create policy "Org members can insert audit events"
on public.audit_events
for insert
with check (public.is_org_member(organization_id));

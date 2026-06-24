-- Sprint 4.1: Production invitation & email delivery.
-- Non-destructive: adds invited_user_exists column if missing.

alter table public.organization_invitations
add column if not exists invited_user_exists boolean not null default false;

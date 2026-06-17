-- Sprint 3 billing support.
-- Non-destructive: creates subscriptions only if it does not already exist.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  status text,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_checkout_session_id text,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

create index if not exists subscriptions_organization_id_idx on public.subscriptions(organization_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
create index if not exists subscriptions_stripe_customer_id_idx on public.subscriptions(stripe_customer_id);
create index if not exists subscriptions_stripe_subscription_id_idx on public.subscriptions(stripe_subscription_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

drop policy if exists "Org members can read subscriptions" on public.subscriptions;
create policy "Org members can read subscriptions"
on public.subscriptions
for select
using (public.is_org_member(organization_id));

drop policy if exists "Org admins can insert subscriptions" on public.subscriptions;
create policy "Org admins can insert subscriptions"
on public.subscriptions
for insert
with check (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = subscriptions.organization_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
  )
);

drop policy if exists "Org admins can update subscriptions" on public.subscriptions;
create policy "Org admins can update subscriptions"
on public.subscriptions
for update
using (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = subscriptions.organization_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = subscriptions.organization_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
  )
);

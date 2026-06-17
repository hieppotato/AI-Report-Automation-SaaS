-- Sprint 3 subscriptions schema patch.
-- Use this only when public.subscriptions already exists.
-- Non-destructive: adds missing columns/indexes/policies without creating the table.

alter table if exists public.subscriptions
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists plan text default 'free',
  add column if not exists status text,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_price_id text,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean default false,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create index if not exists subscriptions_organization_id_idx
on public.subscriptions(organization_id);

create index if not exists subscriptions_status_idx
on public.subscriptions(status);

create index if not exists subscriptions_stripe_customer_id_idx
on public.subscriptions(stripe_customer_id);

create index if not exists subscriptions_stripe_subscription_id_idx
on public.subscriptions(stripe_subscription_id);

do $$
begin
  if to_regclass('public.subscriptions') is not null then
    alter table public.subscriptions enable row level security;
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.subscriptions') is not null
     and to_regprocedure('public.set_updated_at()') is not null
     and not exists (
       select 1
       from pg_trigger
       where tgname = 'set_subscriptions_updated_at'
         and tgrelid = 'public.subscriptions'::regclass
     )
  then
    create trigger set_subscriptions_updated_at
    before update on public.subscriptions
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

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

-- Sprint 3.1 LemonSqueezy billing patch.
-- Non-destructive: assumes public.subscriptions already exists.

alter table if exists public.subscriptions
  add column if not exists provider text default 'lemonsqueezy',
  add column if not exists renewal_at timestamptz;

create index if not exists subscriptions_provider_idx
on public.subscriptions(provider);

create index if not exists subscriptions_renewal_at_idx
on public.subscriptions(renewal_at);

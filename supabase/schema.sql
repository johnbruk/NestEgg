-- Nest Egg - schema iniziale MVP
-- Da eseguire nel SQL editor del progetto Supabase.

create extension if not exists pgcrypto;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Famiglia',
  start_date date not null default date '2026-07-01',
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid,
  email text,
  role text not null default 'owner',
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  macro_area text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  amount numeric(12,2) not null default 0,
  expense_date date not null,
  expense_type text not null,
  frequency text not null default 'none',
  payment_method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.due_dates (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  source_expense_id uuid references public.expenses(id) on delete set null,
  title text not null,
  amount numeric(12,2) not null default 0,
  due_date date not null,
  status text not null default 'pending',
  paid_date date,
  priority text not null default 'normal',
  reminder_days int[] not null default array[7,1,0],
  web_notification_enabled boolean not null default true,
  email_notification_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  amount numeric(12,2) not null default 0,
  frequency text not null,
  start_date date not null,
  end_date date,
  day_of_month int,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  year int not null,
  month int not null check (month between 1 and 12),
  planned_amount numeric(12,2) not null default 0,
  actual_amount numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  unique(household_id, category_id, year, month)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  due_date_id uuid references public.due_dates(id) on delete cascade,
  channel text not null default 'web_app',
  title text not null,
  body text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_expenses_household_date on public.expenses(household_id, expense_date desc);
create index if not exists idx_due_dates_household_date on public.due_dates(household_id, due_date asc);
create index if not exists idx_due_dates_status on public.due_dates(status);

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.due_dates enable row level security;
alter table public.recurring_rules enable row level security;
alter table public.budget_items enable row level security;
alter table public.notifications enable row level security;

-- Le policy RLS definitive verranno rifinite quando colleghiamo login e nucleo familiare.
-- Per la fase MVP locale il frontend usa ancora il browser storage.

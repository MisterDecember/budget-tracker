-- PixelVault/Horizon Database Schema
-- Creates tables, indexes, and Row Level Security policies

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Accounts table
create table if not exists public.accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text check (type in ('checking', 'savings', 'credit', 'cash', 'investment')) not null,
  balance numeric(12,2) default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Transactions table
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  account_id uuid references public.accounts on delete set null,
  type text check (type in ('income', 'expense', 'transfer')) not null,
  description text not null,
  amount numeric(12,2) not null,
  category text not null,
  date date not null,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Debts table
create table if not exists public.debts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text check (type in ('mortgage', 'auto', 'student', 'personal', 'credit_card', 'medical', 'other')) not null,
  original_balance numeric(12,2) not null,
  current_balance numeric(12,2) not null,
  interest_rate numeric(5,2) not null,
  minimum_payment numeric(12,2) not null,
  remaining_months integer not null,
  start_date date not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Recurring transactions table
create table if not exists public.recurring_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text check (type in ('income', 'expense', 'transfer')) not null,
  amount numeric(12,2) not null,
  category text not null,
  frequency text check (frequency in ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually')) not null,
  start_date date not null,
  next_date date not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create indexes
create index if not exists accounts_user_id_idx on public.accounts(user_id);
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_date_idx on public.transactions(date);
create index if not exists debts_user_id_idx on public.debts(user_id);
create index if not exists recurring_user_id_idx on public.recurring_transactions(user_id);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.debts enable row level security;
alter table public.recurring_transactions enable row level security;

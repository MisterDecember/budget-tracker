-- =====================================================
-- PIXELVAULT DATABASE SCHEMA FOR SUPABASE
-- =====================================================
-- Run this in Supabase SQL Editor to set up the database
-- Project URL: https://app.supabase.com/project/_/sql
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ACCOUNTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'cash', 'investment')),
  balance NUMERIC(15, 2) DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Accounts policies
CREATE POLICY "Users can view own accounts" 
  ON public.accounts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own accounts" 
  ON public.accounts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts" 
  ON public.accounts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts" 
  ON public.accounts FOR DELETE 
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_type ON public.accounts(type);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Transactions policies
CREATE POLICY "Users can view own transactions" 
  ON public.transactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" 
  ON public.transactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" 
  ON public.transactions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" 
  ON public.transactions FOR DELETE 
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_transactions_category ON public.transactions(category);

-- =====================================================
-- DEBTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mortgage', 'auto', 'student', 'personal', 'credit_card', 'medical', 'other')),
  original_balance NUMERIC(15, 2) NOT NULL,
  current_balance NUMERIC(15, 2) NOT NULL,
  interest_rate NUMERIC(5, 2) NOT NULL,
  minimum_payment NUMERIC(15, 2) NOT NULL,
  remaining_months INTEGER NOT NULL,
  start_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- Debts policies
CREATE POLICY "Users can view own debts" 
  ON public.debts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own debts" 
  ON public.debts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debts" 
  ON public.debts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own debts" 
  ON public.debts FOR DELETE 
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_debts_user_id ON public.debts(user_id);
CREATE INDEX idx_debts_type ON public.debts(type);

-- =====================================================
-- RECURRING TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount NUMERIC(15, 2) NOT NULL,
  category TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually')),
  start_date DATE NOT NULL,
  next_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

-- Recurring transactions policies
CREATE POLICY "Users can view own recurring" 
  ON public.recurring_transactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recurring" 
  ON public.recurring_transactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring" 
  ON public.recurring_transactions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring" 
  ON public.recurring_transactions FOR DELETE 
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_recurring_user_id ON public.recurring_transactions(user_id);
CREATE INDEX idx_recurring_frequency ON public.recurring_transactions(frequency);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_debts_updated_at
  BEFORE UPDATE ON public.debts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_recurring_updated_at
  BEFORE UPDATE ON public.recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- ACCOUNT DELETION FUNCTION
-- =====================================================
-- This function completely removes all user data when called
-- Used for GDPR/CCPA compliance (right to erasure)
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS VOID AS $$
BEGIN
  -- Data is automatically deleted via CASCADE
  -- Just need to delete the auth user
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

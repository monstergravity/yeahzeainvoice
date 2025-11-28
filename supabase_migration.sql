-- Yeahzea Supabase 数据库迁移脚本
-- 执行此脚本在Supabase SQL Editor中创建所有必需的表和策略

-- ============================================
-- 1. 创建 expenses 表（发票表）
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  merchant TEXT NOT NULL,
  category TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  tax DECIMAL(10, 2) DEFAULT 0,
  original_amount DECIMAL(10, 2),
  original_currency TEXT,
  receipt_url TEXT,
  file_type TEXT CHECK (file_type IN ('image', 'pdf')),
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'warning', 'error')),
  warning_message TEXT,
  selected BOOLEAN DEFAULT FALSE,
  trip_id TEXT,
  ai_audit_ran BOOLEAN DEFAULT FALSE,
  ai_analysis TEXT,
  is_personal_expense BOOLEAN DEFAULT FALSE,
  audit_warning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE IF EXISTS expenses
  ADD COLUMN IF NOT EXISTS buyer_name TEXT,
  ADD COLUMN IF NOT EXISTS buyer_tax_id TEXT;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date DESC);

-- ============================================
-- 2. 创建 trips 表（出差行程表）
-- ============================================
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at DESC);

-- ============================================
-- 3. 创建 user_credits 表（用户积分表）
-- ============================================
CREATE TABLE IF NOT EXISTS user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 10 CHECK (credits >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. 创建 credit_transactions 表（积分交易历史表）
-- ============================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- 正数表示增加，负数表示减少
  type TEXT NOT NULL CHECK (type IN ('scan', 'audit', 'purchase', 'refund', 'bonus')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- ============================================
-- 5. 创建 updated_at 自动更新触发器函数
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 expenses 表添加触发器
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为 trips 表添加触发器
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为 user_credits 表添加触发器
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON user_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. 启用 Row Level Security (RLS)
-- ============================================

-- 启用 RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. 创建 RLS 策略
-- ============================================

-- expenses 表策略：用户只能访问自己的发票
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- trips 表策略：用户只能访问自己的行程
CREATE POLICY "Users can view their own trips"
  ON trips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trips"
  ON trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips"
  ON trips FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips"
  ON trips FOR DELETE
  USING (auth.uid() = user_id);

-- user_credits 表策略：用户只能访问自己的积分
CREATE POLICY "Users can view their own credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credits"
  ON user_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
  ON user_credits FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- credit_transactions 表策略：用户只能访问自己的交易历史
CREATE POLICY "Users can view their own credit transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit transactions"
  ON credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 8. 创建新用户自动初始化积分的函数
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, credits)
  VALUES (NEW.id, 10)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：新用户注册时自动创建积分记录
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 6. 创建 credit_card_transactions 表（信用卡交易表）
-- ============================================
CREATE TABLE IF NOT EXISTS credit_card_transactions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  merchant TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  transaction_type TEXT NOT NULL DEFAULT 'purchase' CHECK (transaction_type IN ('purchase', 'refund', 'fee', 'payment')),
  card_last4 TEXT,
  description TEXT,
  statement_id TEXT,
  matched_expense_id TEXT REFERENCES expenses(id) ON DELETE SET NULL,
  match_status TEXT NOT NULL DEFAULT 'unmatched' CHECK (match_status IN ('matched', 'pending', 'unmatched')),
  match_confidence DECIMAL(3, 2),
  -- Additional fields for better bank statement support
  counter_party TEXT,
  reference_number TEXT,
  account_number TEXT,
  category TEXT,
  location TEXT,
  post_date TIMESTAMP WITH TIME ZONE,
  raw_data JSONB, -- Store original row data for debugging and future enhancements
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_cc_transactions_user_id ON credit_card_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cc_transactions_date ON credit_card_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_cc_transactions_match_status ON credit_card_transactions(match_status);
CREATE INDEX IF NOT EXISTS idx_cc_transactions_user_date ON credit_card_transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_cc_transactions_matched_expense ON credit_card_transactions(matched_expense_id) WHERE matched_expense_id IS NOT NULL;

-- RLS Policies for credit_card_transactions
ALTER TABLE credit_card_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own transactions
CREATE POLICY "Users can view own transactions"
  ON credit_card_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
  ON credit_card_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own transactions
CREATE POLICY "Users can update own transactions"
  ON credit_card_transactions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own transactions
CREATE POLICY "Users can delete own transactions"
  ON credit_card_transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 完成！
-- ============================================
-- 所有表和策略已创建完成
-- 现在可以在Supabase Dashboard中创建Storage bucket


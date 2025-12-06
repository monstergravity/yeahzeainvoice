-- ============================================
-- Yeahzea 报销流程和财务入账数据库迁移脚本
-- 执行此脚本在Supabase SQL Editor中创建审批和会计相关表
-- ============================================

-- ============================================
-- 1. 报销单表 (Reimbursement Requests)
-- ============================================
CREATE TABLE IF NOT EXISTS reimbursement_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'paid')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_reimbursement_user_id ON reimbursement_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_reimbursement_status ON reimbursement_requests(status);
CREATE INDEX IF NOT EXISTS idx_reimbursement_created_at ON reimbursement_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reimbursement_approved_by ON reimbursement_requests(approved_by);

-- ============================================
-- 2. 报销单-发票关联表
-- ============================================
CREATE TABLE IF NOT EXISTS reimbursement_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reimbursement_id UUID NOT NULL REFERENCES reimbursement_requests(id) ON DELETE CASCADE,
  expense_id TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reimbursement_id, expense_id) -- 防止重复关联
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_reimbursement_expenses_reimbursement_id ON reimbursement_expenses(reimbursement_id);
CREATE INDEX IF NOT EXISTS idx_reimbursement_expenses_expense_id ON reimbursement_expenses(expense_id);

-- ============================================
-- 3. 审批工作流表
-- ============================================
CREATE TABLE IF NOT EXISTS approval_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reimbursement_id UUID NOT NULL REFERENCES reimbursement_requests(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES auth.users(id),
  level INTEGER NOT NULL DEFAULT 1, -- 审批层级（1=一级审批，2=二级审批等）
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_approval_workflows_reimbursement_id ON approval_workflows(reimbursement_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_approver_id ON approval_workflows(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_status ON approval_workflows(status);

-- ============================================
-- 4. 审批历史表
-- ============================================
CREATE TABLE IF NOT EXISTS approval_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reimbursement_id UUID NOT NULL REFERENCES reimbursement_requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'paid', 'cancelled')),
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_approval_history_reimbursement_id ON approval_history(reimbursement_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_actor_id ON approval_history(actor_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_created_at ON approval_history(created_at DESC);

-- ============================================
-- 5. 会计科目表 (Chart of Accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE, -- 科目代码，如 "6001"
  name TEXT NOT NULL, -- 科目名称（中文），如 "差旅费"
  name_en TEXT, -- 科目名称（英文），如 "Travel Expense"
  category TEXT NOT NULL CHECK (category IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_id UUID REFERENCES chart_of_accounts(id), -- 支持科目层级（如：6001-差旅费 -> 600101-国内差旅费）
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_code ON chart_of_accounts(code);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_category ON chart_of_accounts(category);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_parent_id ON chart_of_accounts(parent_id);

-- ============================================
-- 6. 费用-科目映射表（用于自动匹配）
-- ============================================
CREATE TABLE IF NOT EXISTS expense_account_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL 表示全局映射
  expense_category TEXT, -- 费用分类（如 "Travel", "Meals"）
  merchant_keyword TEXT, -- 商户关键词（如 "Starbucks"）
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  priority INTEGER DEFAULT 0, -- 优先级，数字越大优先级越高
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_expense_account_mappings_user_id ON expense_account_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_account_mappings_category ON expense_account_mappings(expense_category);
CREATE INDEX IF NOT EXISTS idx_expense_account_mappings_account_id ON expense_account_mappings(account_id);

-- ============================================
-- 7. 凭证表 (Vouchers)
-- ============================================
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_number TEXT NOT NULL UNIQUE, -- 凭证号，如 "V-2025-001"
  reimbursement_id UUID REFERENCES reimbursement_requests(id), -- 关联的报销单（可为空，支持手动创建凭证）
  voucher_date DATE NOT NULL,
  description TEXT,
  total_debit DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_credit DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CNY',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
  posted_at TIMESTAMP WITH TIME ZONE,
  posted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_debit_credit_balance CHECK (total_debit = total_credit) -- 借贷必须平衡
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_vouchers_voucher_number ON vouchers(voucher_number);
CREATE INDEX IF NOT EXISTS idx_vouchers_reimbursement_id ON vouchers(reimbursement_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_voucher_date ON vouchers(voucher_date DESC);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);

-- ============================================
-- 8. 会计分录表 (Accounting Entries)
-- ============================================
CREATE TABLE IF NOT EXISTS accounting_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  debit_amount DECIMAL(10, 2) DEFAULT 0,
  credit_amount DECIMAL(10, 2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CNY',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_entry_balance CHECK (
    (debit_amount > 0 AND credit_amount = 0) OR 
    (debit_amount = 0 AND credit_amount > 0)
  ) -- 每笔分录必须是借方或贷方，不能同时为0或同时有值
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_accounting_entries_voucher_id ON accounting_entries(voucher_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_account_id ON accounting_entries(account_id);

-- ============================================
-- 9. 凭证附件表（存储凭证相关的发票）
-- ============================================
CREATE TABLE IF NOT EXISTS voucher_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  expense_id TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voucher_id, expense_id) -- 防止重复关联
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_voucher_attachments_voucher_id ON voucher_attachments(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_attachments_expense_id ON voucher_attachments(expense_id);

-- ============================================
-- 10. 创建 updated_at 触发器
-- ============================================
-- 为 reimbursement_requests 添加触发器
CREATE TRIGGER update_reimbursement_requests_updated_at
  BEFORE UPDATE ON reimbursement_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为 approval_workflows 添加触发器
CREATE TRIGGER update_approval_workflows_updated_at
  BEFORE UPDATE ON approval_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为 chart_of_accounts 添加触发器
CREATE TRIGGER update_chart_of_accounts_updated_at
  BEFORE UPDATE ON chart_of_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为 vouchers 添加触发器
CREATE TRIGGER update_vouchers_updated_at
  BEFORE UPDATE ON vouchers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. Row Level Security (RLS) 策略
-- ============================================

-- 启用 RLS
ALTER TABLE reimbursement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reimbursement_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_account_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_attachments ENABLE ROW LEVEL SECURITY;

-- reimbursement_requests 策略
CREATE POLICY "Users can view their own reimbursement requests"
  ON reimbursement_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reimbursement requests"
  ON reimbursement_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reimbursement requests"
  ON reimbursement_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 审批者可以查看和更新所有报销单（实际应用中可能需要更细粒度的权限控制）
CREATE POLICY "Approvers can view all reimbursement requests"
  ON reimbursement_requests FOR SELECT
  TO authenticated
  USING (true); -- 简化版：所有认证用户都可以查看，实际应该基于角色

CREATE POLICY "Approvers can update reimbursement requests"
  ON reimbursement_requests FOR UPDATE
  TO authenticated
  USING (true); -- 简化版：实际应该基于角色

-- reimbursement_expenses 策略
CREATE POLICY "Users can manage expenses in their reimbursement requests"
  ON reimbursement_expenses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reimbursement_requests
      WHERE reimbursement_requests.id = reimbursement_expenses.reimbursement_id
      AND reimbursement_requests.user_id = auth.uid()
    )
  );

-- approval_workflows 策略
CREATE POLICY "Users can view workflows for their reimbursement requests"
  ON approval_workflows FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reimbursement_requests
      WHERE reimbursement_requests.id = approval_workflows.reimbursement_id
      AND (reimbursement_requests.user_id = auth.uid() OR approval_workflows.approver_id = auth.uid())
    )
  );

CREATE POLICY "Approvers can update their workflows"
  ON approval_workflows FOR UPDATE
  TO authenticated
  USING (auth.uid() = approver_id);

-- approval_history 策略
CREATE POLICY "Users can view history for their reimbursement requests"
  ON approval_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reimbursement_requests
      WHERE reimbursement_requests.id = approval_history.reimbursement_id
      AND reimbursement_requests.user_id = auth.uid()
    )
  );

-- chart_of_accounts 策略（所有认证用户可查看，管理员可修改）
CREATE POLICY "All authenticated users can view chart of accounts"
  ON chart_of_accounts FOR SELECT
  TO authenticated
  USING (true);

-- expense_account_mappings 策略
CREATE POLICY "Users can manage their own expense account mappings"
  ON expense_account_mappings FOR ALL
  TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

-- vouchers 策略（所有认证用户可查看，创建者和管理员可修改）
CREATE POLICY "All authenticated users can view vouchers"
  ON vouchers FOR SELECT
  TO authenticated
  USING (true);

-- accounting_entries 策略（跟随凭证权限）
CREATE POLICY "Users can view entries for accessible vouchers"
  ON accounting_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vouchers
      WHERE vouchers.id = accounting_entries.voucher_id
    )
  );

-- voucher_attachments 策略（跟随凭证权限）
CREATE POLICY "Users can view attachments for accessible vouchers"
  ON voucher_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vouchers
      WHERE vouchers.id = voucher_attachments.voucher_id
    )
  );

-- ============================================
-- 12. 初始化默认会计科目
-- ============================================
INSERT INTO chart_of_accounts (code, name, name_en, category) VALUES
  ('6001', '差旅费', 'Travel Expense', 'expense'),
  ('600101', '国内差旅费', 'Domestic Travel', 'expense'),
  ('600102', '国际差旅费', 'International Travel', 'expense'),
  ('6002', '餐费', 'Meals & Entertainment', 'expense'),
  ('6003', '交通费', 'Transportation', 'expense'),
  ('6004', '住宿费', 'Accommodation', 'expense'),
  ('6005', '办公用品', 'Office Supplies', 'expense'),
  ('6006', '通讯费', 'Communication', 'expense'),
  ('6007', '培训费', 'Training', 'expense'),
  ('6008', '其他费用', 'Other Expenses', 'expense'),
  ('1001', '现金', 'Cash', 'asset'),
  ('1002', '银行存款', 'Bank Deposit', 'asset'),
  ('2202', '应付账款', 'Accounts Payable', 'liability')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 完成
-- ============================================
-- 所有表、索引、策略和初始数据已创建完成


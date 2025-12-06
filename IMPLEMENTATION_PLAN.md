# Yeahzea 完整实施计划
## 从 Idea 1 到审批流程的详细 Milestone 规划

---

## 📋 总体架构

### 技术选型
- **动画库**: Framer Motion (更强大，支持复杂动画序列)
- **状态管理**: React Hooks + Context (审批流程状态)
- **数据库**: Supabase (PostgreSQL)

### 核心流程
```
上传发票 → OCR识别 → AI审计 → 分类 → 提交报销单 → 审批 → 生成凭证 → 财务入账
```

---

## 🎯 Phase 1: Idea 1 - 智能上传流程动画

### Milestone 1.1: 安装和配置 Framer Motion
**目标**: 设置动画库基础

**任务**:
- [ ] 安装 `framer-motion` 包
- [ ] 创建动画工具文件 `utils/animations.ts`
- [ ] 定义通用动画变体（variants）

**检查点**:
- ✅ 包安装成功
- ✅ 动画工具文件创建
- ✅ 无 TypeScript 错误

**预计时间**: 30分钟

---

### Milestone 1.2: 上传模态框动画增强
**目标**: 为 UploadModal 添加拖拽和上传动画

**任务**:
- [ ] 添加拖拽区域动画（hover 效果）
- [ ] 文件选择时的预览卡片动画
- [ ] 上传进度条动画（每张发票独立）
- [ ] 文件列表的进入/退出动画

**检查点**:
- ✅ 拖拽时有视觉反馈
- ✅ 文件预览卡片平滑出现
- ✅ 进度条实时更新
- ✅ 列表项有淡入动画

**预计时间**: 2小时

---

### Milestone 1.3: OCR 处理状态动画
**目标**: 显示 OCR 识别过程

**任务**:
- [ ] 创建处理状态组件 `components/ProcessingCard.tsx`
- [ ] 添加"识别中"脉冲动画
- [ ] 成功/失败状态动画（✓/✗ 图标）
- [ ] 状态转换动画（待处理 → 处理中 → 完成）

**检查点**:
- ✅ 处理中状态有动画指示
- ✅ 成功/失败有明确视觉反馈
- ✅ 状态转换流畅

**预计时间**: 2小时

---

### Milestone 1.4: 批量处理可视化
**目标**: 显示批量上传的整体进度

**任务**:
- [ ] 顶部进度条组件（`3/10 处理中`）
- [ ] 每张发票卡片状态指示器
- [ ] 完成时的成功动画（卡片飞入列表）
- [ ] 失败时的错误提示动画

**检查点**:
- ✅ 进度条实时更新
- ✅ 每张卡片状态清晰
- ✅ 完成动画流畅
- ✅ 错误提示明显

**预计时间**: 2小时

---

### Milestone 1.5: 智能提示动画
**目标**: 重复检测和个人支出提示动画

**任务**:
- [ ] 重复发票闪烁动画（黄色）
- [ ] 个人支出警告动画（红色）
- [ ] 自动分类标签淡入动画
- [ ] 提示气泡动画

**检查点**:
- ✅ 重复检测有视觉提示
- ✅ 个人支出警告明显
- ✅ 分类标签平滑出现

**预计时间**: 1.5小时

**Phase 1 总计**: ~8小时

---

## 🎯 Phase 2: Idea 2 - 一键报销向导

### Milestone 2.1: 向导状态管理
**目标**: 创建向导流程的状态管理

**任务**:
- [ ] 创建 `types/wizard.ts` 定义向导状态
- [ ] 创建 `contexts/ReimbursementWizardContext.tsx`
- [ ] 定义向导步骤枚举
- [ ] 实现步骤导航逻辑

**检查点**:
- ✅ 状态类型定义完整
- ✅ Context 正常工作
- ✅ 步骤切换流畅

**预计时间**: 1.5小时

---

### Milestone 2.2: 向导 UI 组件
**目标**: 创建向导界面

**任务**:
- [ ] 创建 `components/ReimbursementWizard.tsx`
- [ ] 步骤指示器组件（StepIndicator）
- [ ] 步骤内容容器（带过渡动画）
- [ ] 前进/后退按钮

**检查点**:
- ✅ 向导界面美观
- ✅ 步骤指示清晰
- ✅ 过渡动画流畅

**预计时间**: 2小时

---

### Milestone 2.3: 步骤 1 - 智能发票选择
**目标**: 自动选择可报销发票

**任务**:
- [ ] 自动过滤个人支出
- [ ] 显示发票列表（带选择动画）
- [ ] 批量选择/取消选择
- [ ] 显示总金额预览

**检查点**:
- ✅ 自动过滤正确
- ✅ 选择动画流畅
- ✅ 总金额实时更新

**预计时间**: 2小时

---

### Milestone 2.4: 步骤 2 - 自动分类和分组
**目标**: 自动分类并分组到 Trip

**任务**:
- [ ] 自动分类逻辑（基于商户、日期）
- [ ] 自动匹配到 Trip（如果日期匹配）
- [ ] 显示分类结果（带动画）
- [ ] 允许手动调整

**检查点**:
- ✅ 分类准确
- ✅ Trip 匹配正确
- ✅ 可手动调整

**预计时间**: 2.5小时

---

### Milestone 2.5: 步骤 3 - AI 审计（可选）
**目标**: 批量 AI 审计

**任务**:
- [ ] 显示审计进度
- [ ] 审计结果可视化
- [ ] 标记需要审核的发票
- [ ] 允许跳过审计

**检查点**:
- ✅ 审计进度清晰
- ✅ 结果展示明确
- ✅ 可跳过审计

**预计时间**: 2小时

---

### Milestone 2.6: 步骤 4 - 生成报告预览
**目标**: 生成并预览报销单

**任务**:
- [ ] 生成报告预览
- [ ] 显示报告摘要（总金额、发票数量）
- [ ] PDF 预览（可选）
- [ ] 确认提交按钮

**检查点**:
- ✅ 预览准确
- ✅ 摘要信息完整
- ✅ 提交按钮可用

**预计时间**: 2小时

---

### Milestone 2.7: 步骤 5 - 完成动画
**目标**: 提交成功反馈

**任务**:
- [ ] 成功动画（✓ 图标 + 文字）
- [ ] 自动下载报告（可选）
- [ ] 显示下一步建议
- [ ] 返回主界面按钮

**检查点**:
- ✅ 成功动画明显
- ✅ 报告下载正常
- ✅ 用户体验流畅

**预计时间**: 1.5小时

**Phase 2 总计**: ~13.5小时

---

## 🎯 Phase 3: Idea 3 - 上下文感知的微交互

### Milestone 3.1: 语言本地化系统
**目标**: 实现多语言支持

**任务**:
- [ ] 安装 `i18next` 和 `react-i18next`
- [ ] 创建语言文件 `locales/zh.json`, `locales/en.json`
- [ ] 创建语言切换组件
- [ ] 检测系统语言

**检查点**:
- ✅ 语言切换正常
- ✅ 所有文本已翻译
- ✅ 系统语言检测正确

**预计时间**: 3小时

---

### Milestone 3.2: 上下文提示系统
**目标**: 智能操作提示

**任务**:
- [ ] 创建 `components/ContextualHint.tsx`
- [ ] 实现提示逻辑（基于当前状态）
- [ ] 首次使用引导
- [ ] 空状态提示

**检查点**:
- ✅ 提示准确
- ✅ 引导清晰
- ✅ 空状态友好

**预计时间**: 2小时

---

### Milestone 3.3: 微交互增强
**目标**: 添加细节动画

**任务**:
- [ ] 按钮悬停效果
- [ ] 操作确认动画
- [ ] Toast 通知组件（带动画）
- [ ] 错误恢复提示

**检查点**:
- ✅ 所有交互有反馈
- ✅ Toast 通知正常
- ✅ 错误提示友好

**预计时间**: 2.5小时

---

### Milestone 3.4: 过渡动画优化
**目标**: 优化页面和模态框过渡

**任务**:
- [ ] 页面切换动画
- [ ] 模态框出现/消失动画
- [ ] 列表更新动画
- [ ] 删除动画

**检查点**:
- ✅ 所有过渡流畅
- ✅ 无性能问题
- ✅ 动画时长合适

**预计时间**: 2小时

**Phase 3 总计**: ~9.5小时

---

## 🎯 Phase 4: 审批流程系统

### Milestone 4.1: 数据库设计 - 报销单表
**目标**: 创建报销单相关表

**任务**:
- [ ] 创建 `reimbursement_requests` 表
- [ ] 创建 `reimbursement_expenses` 关联表
- [ ] 创建 `approval_workflows` 表
- [ ] 创建 `approval_history` 表
- [ ] 添加 RLS 策略

**SQL 结构**:
```sql
-- 报销单表
CREATE TABLE reimbursement_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
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

-- 报销单-发票关联表
CREATE TABLE reimbursement_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reimbursement_id UUID NOT NULL REFERENCES reimbursement_requests(id) ON DELETE CASCADE,
  expense_id TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 审批工作流表
CREATE TABLE approval_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reimbursement_id UUID NOT NULL REFERENCES reimbursement_requests(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES auth.users(id),
  level INTEGER NOT NULL, -- 审批层级
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 审批历史表
CREATE TABLE approval_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reimbursement_id UUID NOT NULL REFERENCES reimbursement_requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'paid')),
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**检查点**:
- ✅ 所有表创建成功
- ✅ 外键关系正确
- ✅ RLS 策略配置
- ✅ 索引创建

**预计时间**: 1.5小时

---

### Milestone 4.2: TypeScript 类型定义
**目标**: 定义审批流程相关类型

**任务**:
- [ ] 更新 `types.ts` 添加新接口
- [ ] `ReimbursementRequest` 接口
- [ ] `ApprovalWorkflow` 接口
- [ ] `ApprovalHistory` 接口

**检查点**:
- ✅ 类型定义完整
- ✅ 与数据库结构匹配
- ✅ 无 TypeScript 错误

**预计时间**: 30分钟

---

### Milestone 4.3: 报销单服务层
**目标**: 创建 Supabase 服务函数

**任务**:
- [ ] 在 `services/supabaseService.ts` 添加 `reimbursementService`
- [ ] `createReimbursementRequest()` - 创建报销单
- [ ] `submitReimbursementRequest()` - 提交报销单
- [ ] `getReimbursementRequests()` - 获取报销单列表
- [ ] `approveReimbursementRequest()` - 审批报销单
- [ ] `rejectReimbursementRequest()` - 拒绝报销单

**检查点**:
- ✅ 所有函数正常工作
- ✅ 错误处理完善
- ✅ 数据验证正确

**预计时间**: 3小时

---

### Milestone 4.4: 报销单创建 UI
**目标**: 创建报销单界面

**任务**:
- [ ] 创建 `components/ReimbursementRequestModal.tsx`
- [ ] 发票选择界面
- [ ] 报销单信息表单
- [ ] 预览和确认

**检查点**:
- ✅ UI 美观易用
- ✅ 表单验证正确
- ✅ 预览准确

**预计时间**: 3小时

---

### Milestone 4.5: 审批界面
**目标**: 创建审批者界面

**任务**:
- [ ] 创建 `components/ApprovalView.tsx`
- [ ] 报销单详情展示
- [ ] 发票列表展示
- [ ] 审批/拒绝按钮
- [ ] 审批意见输入

**检查点**:
- ✅ 信息展示完整
- ✅ 审批操作流畅
- ✅ 意见保存成功

**预计时间**: 3小时

---

### Milestone 4.6: 审批状态管理
**目标**: 实现状态流转逻辑

**任务**:
- [ ] 状态机实现（draft → submitted → approved/rejected → paid）
- [ ] 状态转换验证
- [ ] 通知系统（可选）
- [ ] 状态更新动画

**检查点**:
- ✅ 状态流转正确
- ✅ 验证逻辑完善
- ✅ 动画流畅

**预计时间**: 2.5小时

**Phase 4 总计**: ~13.5小时

---

## 🎯 Phase 5: 财务入账和会计科目

### Milestone 5.1: 数据库设计 - 会计科目表
**目标**: 创建会计科目相关表

**任务**:
- [ ] 创建 `chart_of_accounts` 表
- [ ] 创建 `accounting_entries` 表（会计分录）
- [ ] 创建 `vouchers` 表（凭证）
- [ ] 创建 `voucher_entries` 表（凭证分录）

**SQL 结构**:
```sql
-- 会计科目表
CREATE TABLE chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE, -- 科目代码，如 "6001"
  name TEXT NOT NULL, -- 科目名称，如 "差旅费"
  name_en TEXT, -- 英文名称
  category TEXT NOT NULL CHECK (category IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_id UUID REFERENCES chart_of_accounts(id), -- 支持科目层级
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 会计分录表
CREATE TABLE accounting_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  debit_amount DECIMAL(10, 2) DEFAULT 0,
  credit_amount DECIMAL(10, 2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CNY',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 凭证表
CREATE TABLE vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_number TEXT NOT NULL UNIQUE, -- 凭证号，如 "V-2025-001"
  reimbursement_id UUID REFERENCES reimbursement_requests(id),
  voucher_date DATE NOT NULL,
  description TEXT,
  total_debit DECIMAL(10, 2) NOT NULL,
  total_credit DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
  posted_at TIMESTAMP WITH TIME ZONE,
  posted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 凭证附件表（存储凭证相关的发票）
CREATE TABLE voucher_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  expense_id TEXT NOT NULL REFERENCES expenses(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**检查点**:
- ✅ 所有表创建成功
- ✅ 科目代码唯一
- ✅ 借贷平衡验证
- ✅ RLS 策略配置

**预计时间**: 2小时

---

### Milestone 5.2: 默认会计科目数据
**目标**: 初始化常用会计科目

**任务**:
- [ ] 创建 `supabase_migration_chart_of_accounts.sql`
- [ ] 插入常用科目（差旅费、餐费、交通费等）
- [ ] 支持中英文科目名称

**检查点**:
- ✅ 科目数据完整
- ✅ 中英文名称正确
- ✅ 科目分类准确

**预计时间**: 1小时

---

### Milestone 5.3: 会计科目服务层
**目标**: 创建会计科目相关服务

**任务**:
- [ ] 在 `services/supabaseService.ts` 添加 `accountingService`
- [ ] `getChartOfAccounts()` - 获取科目列表
- [ ] `createAccount()` - 创建新科目
- [ ] `mapExpenseToAccount()` - 费用到科目的映射

**检查点**:
- ✅ 服务函数正常
- ✅ 科目查询快速
- ✅ 映射逻辑正确

**预计时间**: 2小时

---

### Milestone 5.4: 自动生成凭证逻辑
**目标**: 审批后自动生成会计凭证

**任务**:
- [ ] 创建 `services/voucherService.ts`
- [ ] `generateVoucherFromReimbursement()` - 从报销单生成凭证
- [ ] 自动匹配会计科目（基于费用分类）
- [ ] 借贷平衡验证
- [ ] 生成凭证号

**检查点**:
- ✅ 凭证生成正确
- ✅ 科目匹配准确
- ✅ 借贷平衡
- ✅ 凭证号唯一

**预计时间**: 4小时

---

### Milestone 5.5: 凭证管理 UI
**目标**: 创建凭证查看和管理界面

**任务**:
- [ ] 创建 `components/VoucherView.tsx`
- [ ] 凭证列表展示
- [ ] 凭证详情展示（借贷分录）
- [ ] 凭证打印/导出
- [ ] 凭证过账功能

**检查点**:
- ✅ UI 清晰易用
- ✅ 凭证信息完整
- ✅ 打印格式正确
- ✅ 过账功能正常

**预计时间**: 3.5小时

---

### Milestone 5.6: 凭证与报销单关联
**目标**: 建立凭证和报销单的关联

**任务**:
- [ ] 审批通过后自动生成凭证
- [ ] 凭证中关联所有相关发票
- [ ] 凭证详情中显示发票列表
- [ ] 支持从凭证追溯到报销单

**检查点**:
- ✅ 关联关系正确
- ✅ 追溯功能正常
- ✅ 数据一致性

**预计时间**: 2小时

**Phase 5 总计**: ~14.5小时

---

## 🎯 Phase 6: 集成和测试

### Milestone 6.1: 流程集成
**目标**: 整合所有功能模块

**任务**:
- [ ] 一键报销向导集成审批流程
- [ ] 审批通过后自动生成凭证
- [ ] 凭证自动入账
- [ ] 状态同步更新

**检查点**:
- ✅ 整个流程顺畅
- ✅ 状态更新及时
- ✅ 无数据丢失

**预计时间**: 3小时

---

### Milestone 6.2: 端到端测试
**目标**: 测试完整用户流程

**任务**:
- [ ] 测试上传 → 识别 → 提交 → 审批 → 凭证流程
- [ ] 测试各种边界情况
- [ ] 测试错误处理
- [ ] 性能测试

**检查点**:
- ✅ 所有流程正常
- ✅ 错误处理完善
- ✅ 性能可接受

**预计时间**: 4小时

---

### Milestone 6.3: UI/UX 优化
**目标**: 最终用户体验优化

**任务**:
- [ ] 统一动画风格
- [ ] 优化加载状态
- [ ] 优化错误提示
- [ ] 响应式设计检查

**检查点**:
- ✅ 动画风格统一
- ✅ 加载状态友好
- ✅ 移动端适配

**预计时间**: 3小时

**Phase 6 总计**: ~10小时

---

## 📊 总体时间估算

| Phase | 时间估算 |
|-------|---------|
| Phase 1: Idea 1 - 动画 | ~8小时 |
| Phase 2: Idea 2 - 一键报销向导 | ~13.5小时 |
| Phase 3: Idea 3 - 微交互 | ~9.5小时 |
| Phase 4: 审批流程 | ~13.5小时 |
| Phase 5: 财务入账 | ~14.5小时 |
| Phase 6: 集成测试 | ~10小时 |
| **总计** | **~69小时** |

---

## 🔍 质量检查清单

### 每个 Milestone 完成后检查：
- [ ] 代码无 TypeScript 错误
- [ ] 代码无 Linter 警告
- [ ] 功能按预期工作
- [ ] UI 响应流畅
- [ ] 错误处理完善
- [ ] 数据库操作正确
- [ ] RLS 策略配置

### 每个 Phase 完成后检查：
- [ ] 所有 Milestone 完成
- [ ] 集成测试通过
- [ ] 文档更新
- [ ] 代码审查

---

## 📝 下一步行动

1. **立即开始**: Phase 1, Milestone 1.1 - 安装 Framer Motion
2. **并行准备**: 开始设计数据库迁移脚本
3. **持续沟通**: 每个 Milestone 完成后确认再继续

---

## 🚨 风险提示

1. **动画性能**: 大量动画可能影响性能，需要优化
2. **数据库复杂度**: 会计科目和凭证逻辑复杂，需要仔细设计
3. **审批流程**: 多层级审批需要清晰的权限管理
4. **数据一致性**: 报销单、凭证、会计分录需要保持一致性

---

## 📚 参考资料

- Framer Motion 文档: https://www.framer.com/motion/
- Supabase RLS 指南: https://supabase.com/docs/guides/auth/row-level-security
- 会计基础知识: 借贷平衡、科目分类

---

**计划制定日期**: 2025-01-XX
**预计完成日期**: 根据开发速度调整


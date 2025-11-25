# Supabase 数据库设置指南

## 步骤 1: 在 Supabase Dashboard 中执行 SQL 迁移

1. 登录到 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目
3. 点击左侧菜单中的 **SQL Editor**
4. 点击 **New Query** 按钮
5. 复制 `supabase_migration.sql` 文件中的所有内容
6. 粘贴到 SQL Editor 中
7. 点击 **Run** 按钮执行脚本

## 步骤 2: 创建 Storage Bucket

1. 在 Supabase Dashboard 中，点击左侧菜单的 **Storage**
2. 点击 **New bucket** 按钮
3. 配置如下：
   - **Name**: `receipts`
   - **Public bucket**: ✅ 勾选（允许公开访问收据图片）
   - 点击 **Create bucket**

### 配置 Storage 策略

**方法 1: 使用 SQL 脚本（推荐）**

1. 在 Supabase Dashboard 中，打开 **SQL Editor**
2. 复制 `storage_policies.sql` 文件中的所有内容
3. 粘贴到 SQL Editor 中
4. 点击 **Run** 执行脚本

这将自动创建所有必需的 Storage 策略。

**方法 2: 手动在 Dashboard 中配置**

1. 点击 `receipts` bucket
2. 点击 **Policies** 标签
3. 点击 **New Policy**，选择 **Create a policy from scratch**

#### 上传策略（Upload Policy）
- **Policy name**: `Users can upload receipts`
- **Allowed operation**: INSERT
- **Policy definition**:
```sql
bucket_id = 'receipts'
```

#### 读取策略（Read Policy）
- **Policy name**: `Users can read receipts`
- **Allowed operation**: SELECT
- **Policy definition**:
```sql
bucket_id = 'receipts'
```

#### 删除策略（Delete Policy）
- **Policy name**: `Users can delete receipts`
- **Allowed operation**: DELETE
- **Policy definition**:
```sql
bucket_id = 'receipts'
```

**注意**: 上述策略允许所有认证用户访问 receipts bucket。如果需要更严格的策略（只允许用户访问自己的文件），请使用 `storage_policies.sql` 中注释掉的更严格策略。

## 步骤 3: 验证表创建

在 SQL Editor 中运行以下查询来验证表是否创建成功：

```sql
-- 检查所有表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('expenses', 'trips', 'user_credits', 'credit_transactions');

-- 检查 RLS 是否启用
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('expenses', 'trips', 'user_credits', 'credit_transactions');
```

应该看到 4 个表，且 `rowsecurity` 都为 `true`。

## 步骤 4: 测试数据库连接

1. 确保 `.env.local` 文件包含正确的 Supabase 配置：
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

2. 启动应用：
```bash
npm run dev
```

3. 尝试注册一个新用户，系统应该：
   - 自动创建用户账户
   - 自动创建初始 10 个 credits
   - 可以正常使用应用

## 常见问题

### 问题 1: RLS 策略导致无法访问数据
**解决方案**: 检查策略是否正确创建，确保使用 `auth.uid()` 来匹配用户ID。

### 问题 2: Storage 上传失败
**解决方案**: 
- 检查 bucket 是否设置为 public
- 检查 Storage 策略是否正确配置
- 确保文件路径格式为 `{userId}/{expenseId}.{ext}`

### 问题 3: 新用户没有自动获得 credits
**解决方案**: 
- 检查 `handle_new_user()` 函数是否正确创建
- 检查触发器是否已创建
- 可以手动为新用户创建 credits 记录：
```sql
INSERT INTO user_credits (user_id, credits)
VALUES ('user-uuid-here', 10);
```

## 表结构说明

### expenses 表
存储所有发票/收据数据，包括：
- 基本信息（日期、商户、金额、货币）
- AI 分析结果
- 收据文件 URL
- 关联的行程 ID

### trips 表
存储出差行程信息，用于分组发票。

### user_credits 表
存储每个用户的积分余额。

### credit_transactions 表
存储所有积分交易历史，用于审计和追踪。

## 下一步

设置完成后，您可以：
1. 测试用户注册和登录
2. 测试发票上传和扫描
3. 测试 AI Audit 功能
4. 验证积分扣除是否正确


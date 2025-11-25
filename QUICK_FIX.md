# 快速修复 Trip 和 Expense 保存问题

## 已做的改进

1. ✅ 添加了详细的错误日志
2. ✅ 添加了用户友好的错误提示
3. ✅ 添加了失败时的状态回滚
4. ✅ 添加了调试信息输出

## 立即检查的事项

### 1. 打开浏览器控制台

按 F12 打开开发者工具，查看 Console 标签页。当您：
- 创建 trip 时，应该看到：`Creating trip: {...}`
- 上传发票时，应该看到：`Adding expense: {...}`

如果看到错误，请查看错误信息。

### 2. 常见错误和解决方案

#### 错误：`new row violates row-level security policy`
**原因**: RLS 策略阻止了插入
**解决**: 在 Supabase SQL Editor 中运行：

```sql
-- 检查并重新创建 trips 表的 INSERT 策略
DROP POLICY IF EXISTS "Users can insert their own trips" ON trips;
CREATE POLICY "Users can insert their own trips"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 检查并重新创建 expenses 表的 INSERT 策略
DROP POLICY IF EXISTS "Users can insert their own expenses" ON expenses;
CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

#### 错误：`column "xxx" does not exist`
**原因**: 表结构不匹配
**解决**: 重新运行 `supabase_migration.sql` 脚本

#### 错误：`null value in column "xxx" violates not-null constraint`
**原因**: 必需字段缺失
**解决**: 检查代码中是否所有必需字段都已提供

### 3. 验证表是否存在

在 Supabase SQL Editor 中运行：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('expenses', 'trips');
```

应该看到两行结果。

### 4. 测试直接插入

在 Supabase SQL Editor 中，先获取您的用户ID：

```sql
SELECT id, email FROM auth.users;
```

然后使用您的用户ID测试插入（替换 YOUR_USER_ID）：

```sql
-- 测试插入 trip
INSERT INTO trips (id, user_id, name, created_at)
VALUES ('test-' || extract(epoch from now())::text, 'YOUR_USER_ID', 'Test Trip', NOW())
RETURNING *;

-- 测试插入 expense
INSERT INTO expenses (
  id, user_id, date, merchant, amount, currency, status, selected
)
VALUES (
  'test-expense-' || extract(epoch from now())::text,
  'YOUR_USER_ID',
  NOW(),
  'Test Merchant',
  100.00,
  'CNY',
  'valid',
  false
)
RETURNING *;
```

如果直接插入也失败，说明是 RLS 策略问题。

### 5. 检查 RLS 是否启用

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('expenses', 'trips');
```

`rowsecurity` 应该都是 `true`。

### 6. 临时禁用 RLS（仅用于测试）

⚠️ **警告**: 仅用于测试，不要在生产环境使用！

```sql
-- 临时禁用 RLS
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;

-- 测试后重新启用
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
```

## 下一步

1. 打开浏览器控制台
2. 尝试创建 trip 或上传发票
3. 查看控制台输出的错误信息
4. 根据错误信息使用上述解决方案

## 如果问题仍然存在

请提供以下信息：
1. 浏览器控制台的完整错误信息
2. 在 Supabase SQL Editor 中直接插入是否成功
3. RLS 策略检查的结果


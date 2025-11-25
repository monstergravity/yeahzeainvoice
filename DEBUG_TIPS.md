# 调试 Trip 和 Expense 保存问题

## 问题诊断步骤

### 1. 检查浏览器控制台错误

打开浏览器开发者工具（F12），查看 Console 标签页，查找以下错误：
- `Failed to save trip to Supabase:`
- `Failed to save expense to Supabase:`

### 2. 检查 Supabase 表结构

在 Supabase SQL Editor 中运行：

```sql
-- 检查 trips 表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'trips'
ORDER BY ordinal_position;

-- 检查 expenses 表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'expenses'
ORDER BY ordinal_position;
```

### 3. 检查 RLS 策略

```sql
-- 检查 trips 表的 RLS 策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'trips';

-- 检查 expenses 表的 RLS 策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'expenses';
```

### 4. 测试直接插入数据

在 Supabase SQL Editor 中，使用您的用户ID测试：

```sql
-- 替换 'YOUR_USER_ID' 为实际的用户ID（从 auth.users 表中获取）
-- 获取用户ID：
SELECT id, email FROM auth.users;

-- 测试插入 trip
INSERT INTO trips (id, user_id, name, created_at)
VALUES ('test-trip-123', 'YOUR_USER_ID', 'Test Trip', NOW())
RETURNING *;

-- 测试插入 expense
INSERT INTO expenses (
  id, user_id, date, merchant, amount, currency, status, selected, trip_id
)
VALUES (
  'test-expense-123',
  'YOUR_USER_ID',
  NOW(),
  'Test Merchant',
  100.00,
  'CNY',
  'valid',
  false,
  'test-trip-123'
)
RETURNING *;
```

### 5. 检查用户认证状态

在浏览器控制台中运行：

```javascript
// 检查 Supabase 客户端
import { supabase } from './services/supabaseService';

// 检查当前用户
const { data: { user }, error } = await supabase.auth.getUser();
console.log('Current user:', user);
console.log('Auth error:', error);

// 检查 session
const { data: { session }, error: sessionError } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('Session error:', sessionError);
```

### 6. 常见问题

#### 问题 1: RLS 策略阻止插入
**症状**: 控制台显示权限错误
**解决**: 确保 RLS 策略允许 INSERT 操作

#### 问题 2: 数据类型不匹配
**症状**: 控制台显示类型错误
**解决**: 检查 `trip.id` 是否为 TEXT，`expense.id` 是否为 TEXT

#### 问题 3: 外键约束失败
**症状**: 控制台显示外键错误
**解决**: 确保 `user_id` 存在于 `auth.users` 表中

#### 问题 4: 字段缺失
**症状**: 控制台显示 NOT NULL 约束错误
**解决**: 检查所有必需字段是否都已提供

## 临时调试代码

在 `App.tsx` 的 `handleCreateTrip` 函数中添加：

```typescript
const handleCreateTrip = async (name: string) => {
  if (!userId) {
    console.error('No userId!');
    return;
  }

  const newTrip: Trip = {
    id: Date.now().toString(),
    name,
    createdAt: new Date().toISOString()
  };

  console.log('Creating trip:', newTrip);
  console.log('UserId:', userId);

  // ... 其余代码
};
```

在 `addExpense` 函数中添加：

```typescript
const addExpense = async (newExpense: Expense) => {
  if (!userId) {
    console.error('No userId!');
    return;
  }

  console.log('Adding expense:', newExpense);
  console.log('Selected trip ID:', selectedTripId);
  console.log('UserId:', userId);

  // ... 其余代码
};
```


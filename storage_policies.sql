-- Storage Bucket 策略配置
-- 在创建 receipts bucket 后，在 SQL Editor 中执行此脚本

-- 注意：首先需要在 Storage 界面手动创建名为 'receipts' 的 bucket

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can read receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete receipts" ON storage.objects;

-- 允许认证用户上传到 receipts bucket
CREATE POLICY "Users can upload receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
);

-- 允许认证用户读取 receipts bucket 中的文件
CREATE POLICY "Users can read receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts'
);

-- 允许认证用户删除 receipts bucket 中的文件
CREATE POLICY "Users can delete receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts'
);

-- 如果需要更严格的策略（只允许用户访问自己的文件），使用以下策略：
-- 注意：这要求文件路径格式为 {userId}/{filename}

/*
-- 更严格的策略（推荐用于生产环境）
CREATE POLICY "Users can upload their own receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read their own receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
*/


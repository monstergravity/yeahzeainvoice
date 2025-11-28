# 信用卡账单解析和智能匹配系统实现文档

## 概述

本系统实现了智能信用卡账单解析和与发票的自动匹配功能，使用LLM（Gemini）来解析不同格式的银行账单，并通过加权评分算法实现高精度的自动匹配。

## 核心特性

### 1. 多格式账单解析
- **PDF账单**：使用Gemini LLM直接解析PDF，自动识别任何银行格式
- **CSV/Excel账单**：支持结构化解析，失败时自动降级到LLM文本解析
- **统一输出格式**：所有格式都转换为标准化的`CreditCardTransaction`结构

### 2. 智能匹配算法（加权评分系统）

#### 评分权重
- **金额匹配（40%）**：最高优先级，允许±1货币单位误差
- **日期匹配（30%）**：允许±3天容差，超过7天大幅降分
- **商户名称相似度（20%）**：使用商户别名数据库和模糊匹配
- **分类提示（10%）**：如果类别匹配，给予额外加分

#### 匹配阈值
- **≥0.9分**：精确匹配（Exact Match）
- **≥0.7分**：模糊匹配（Fuzzy Match）
- **≥0.5分**：部分匹配（Partial Match，需用户确认）

### 3. 商户别名数据库

自动识别和处理商户名称变体：
- `STARBUCKS 000123` → `Starbucks`
- `DIDI*RIDE` → `Didi`
- `APL*ITUNES.COM` → `Apple`
- `星巴克` → `Starbucks`

支持用户自定义别名映射。

## 技术架构

### 文件结构

```
services/
├── billParserService.ts      # LLM账单解析服务
├── merchantAliasService.ts   # 商户别名和相似度计算
└── reconciliationService.ts  # 匹配算法和数据库操作

components/
└── ReconciliationModal.tsx   # 账单上传UI
```

### 数据流

```
用户上传账单 (PDF/CSV/Excel)
    ↓
billParserService.parseBillPDF/parseBillText
    ↓
Gemini LLM解析 → 标准化JSON
    ↓
保存到Supabase (credit_card_transactions表)
    ↓
matchTransactions (智能匹配算法)
    ↓
生成匹配结果 (MatchResult[])
    ↓
ReconciliationView显示匹配结果
```

## API说明

### billParserService.ts

#### `parseBillPDF(base64Data, mimeType)`
使用Gemini LLM解析PDF账单。

**输入**：
- `base64Data`: PDF文件的base64编码
- `mimeType`: 文件MIME类型（默认'application/pdf'）

**输出**：
```typescript
{
  transactions: CreditCardTransaction[];
  cardNumberSuffix?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  bankName?: string;
}
```

#### `parseBillText(text)`
使用Gemini LLM解析文本格式账单（CSV/Excel的降级方案）。

### merchantAliasService.ts

#### `normalizeMerchantName(merchant)`
标准化商户名称，使用别名数据库。

#### `calculateStringSimilarity(str1, str2)`
计算两个字符串的相似度（0-1）。

#### `getMerchantCategory(merchant)`
从别名数据库获取商户类别。

### reconciliationService.ts

#### `matchTransactions(transactions, expenses)`
智能匹配信用卡交易和发票。

**算法流程**：
1. 计算所有交易-发票对的匹配分数
2. 按分数排序（高到低）
3. 一对一匹配（每个交易只匹配一个发票）
4. 返回匹配结果列表

## 匹配评分公式

```typescript
totalScore = 
  amountScore * 0.4 +      // 金额匹配（40%）
  dateScore * 0.3 +        // 日期匹配（30%）
  merchantScore * 0.2 +    // 商户相似度（20%）
  categoryScore * 0.1;    // 分类提示（10%）
```

### 详细评分规则

#### 金额匹配（amountScore）
- 完全匹配（误差≤1）：1.0分
- 误差>1：`1 - (误差/10)`，最低0分

#### 日期匹配（dateScore）
- 同一天：1.0分
- 1-3天：`1 - (天数/3) * 0.3`（最高0.7分）
- 4-7天：`0.7 - ((天数-3)/4) * 0.3`（0.7到0.4分）
- >7天：`0.4 - (天数-7)/30`（进一步降分）

#### 商户相似度（merchantScore）
- 使用`calculateStringSimilarity`函数
- 考虑别名数据库映射
- 支持部分匹配和模糊匹配

#### 分类提示（categoryScore）
- 类别完全匹配：0.2分
- 类别部分匹配：0.1分
- 无匹配：0分

## 使用示例

### 上传PDF账单

```typescript
// 在ReconciliationModal中
const file = // PDF文件
const arrayBuffer = await file.arrayBuffer();
const base64 = // 转换为base64
const result = await parseBillPDF(base64, 'application/pdf');
// result.transactions 包含所有解析的交易
```

### 自动匹配

```typescript
const matches = matchTransactions(transactions, expenses);
// matches 按置信度排序，包含匹配详情
```

## 优势

1. **格式无关**：LLM可以解析任何银行的账单格式
2. **高精度匹配**：加权评分系统确保高可信度匹配
3. **商户别名**：自动处理商户名称变体
4. **可扩展**：易于添加新的商户别名和匹配规则
5. **降级策略**：CSV/Excel解析失败时自动使用LLM

## 未来扩展

1. **用户自定义别名**：允许用户添加自己的商户别名
2. **学习机制**：记录用户手动匹配，学习匹配模式
3. **批量处理**：支持一次上传多个月份的账单
4. **银行API集成**：直接连接银行API获取账单
5. **多币种匹配**：考虑汇率转换的金额匹配

## 注意事项

1. **LLM成本**：PDF解析使用Gemini API，注意API调用成本
2. **文件大小**：PDF文件建议<10MB，过大可能超时
3. **解析准确性**：复杂格式的账单可能需要手动调整
4. **数据库字段**：确保Supabase表包含所有新字段（运行迁移SQL）

## 故障排查

### 问题：解析失败
- 检查浏览器控制台的错误信息
- 确认API Key配置正确
- 尝试较小的文件或不同格式

### 问题：匹配不准确
- 检查商户别名数据库是否包含相关商户
- 查看匹配详情中的评分分解
- 考虑添加自定义商户别名

### 问题：导入卡住
- 检查数据库字段是否完整
- 查看浏览器控制台的详细错误
- 确认网络连接正常


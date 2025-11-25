import { createClient } from '@supabase/supabase-js';
import { Expense, Trip } from '../types';

// 从环境变量获取Supabase配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 用户认证相关函数
export const authService = {
  // 使用邮箱和密码注册
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  // 使用邮箱和密码登录
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // 登出
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // 获取当前用户
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // 监听认证状态变化
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// 发票数据相关函数
export const expenseService = {
  // 创建发票
  async createExpense(expense: Expense, userId: string, receiptFile?: File) {
    try {
      let receiptUrl = expense.receiptUrl;

      // 如果有文件，上传到Supabase Storage
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${userId}/${expense.id}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, receiptFile);

        if (uploadError) {
          console.error('Error uploading receipt:', uploadError);
        } else {
          // 获取公共URL
          const { data: urlData } = supabase.storage
            .from('receipts')
            .getPublicUrl(fileName);
          receiptUrl = urlData.publicUrl;
        }
      }

      // 保存发票数据到数据库
      const expenseData = {
        id: expense.id,
        user_id: userId,
        date: expense.date,
        merchant: expense.merchant,
        category: expense.category,
        amount: expense.amount,
        currency: expense.currency,
        tax: expense.tax,
        original_amount: expense.originalAmount,
        original_currency: expense.originalCurrency,
        receipt_url: receiptUrl,
        file_type: expense.fileType,
        status: expense.status,
        warning_message: expense.warningMessage,
        selected: expense.selected,
        trip_id: expense.tripId,
        ai_audit_ran: expense.aiAuditRan || false,
        ai_analysis: expense.aiAnalysis,
        is_personal_expense: expense.isPersonalExpense || false,
        audit_warning: expense.auditWarning,
      };
      
      console.log('Inserting expense to Supabase:', expenseData);
      
      const { data, error } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
      } else {
        console.log('Expense inserted successfully:', data);
      }

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // 获取用户的所有发票
  async getExpenses(userId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) return { data: null, error };

    // 转换为Expense类型
    const expenses: Expense[] = (data || []).map((row: any) => ({
      id: row.id,
      date: row.date,
      merchant: row.merchant,
      category: row.category,
      amount: row.amount,
      currency: row.currency,
      tax: row.tax,
      originalAmount: row.original_amount,
      originalCurrency: row.original_currency,
      receiptUrl: row.receipt_url,
      fileType: row.file_type,
      status: row.status,
      warningMessage: row.warning_message,
      selected: row.selected,
      tripId: row.trip_id,
      aiAuditRan: row.ai_audit_ran,
      aiAnalysis: row.ai_analysis,
      isPersonalExpense: row.is_personal_expense,
      auditWarning: row.audit_warning,
    }));

    return { data: expenses, error: null };
  },

  // 更新发票
  async updateExpense(expense: Expense, userId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .update({
        date: expense.date,
        merchant: expense.merchant,
        category: expense.category,
        amount: expense.amount,
        currency: expense.currency,
        tax: expense.tax,
        original_amount: expense.originalAmount,
        original_currency: expense.originalCurrency,
        status: expense.status,
        warning_message: expense.warningMessage,
        selected: expense.selected,
        trip_id: expense.tripId,
        ai_audit_ran: expense.aiAuditRan,
        ai_analysis: expense.aiAnalysis,
        is_personal_expense: expense.isPersonalExpense,
        audit_warning: expense.auditWarning,
      })
      .eq('id', expense.id)
      .eq('user_id', userId)
      .select()
      .single();

    return { data, error };
  },

  // 删除发票
  async deleteExpense(expenseId: string, userId: string) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('user_id', userId);

    return { error };
  },
};

// Trip相关函数
export const tripService = {
  // 创建Trip
  async createTrip(trip: Trip, userId: string) {
    console.log('tripService.createTrip called with:', { trip, userId });
    
    const { data, error } = await supabase
      .from('trips')
      .insert({
        id: trip.id,
        user_id: userId,
        name: trip.name,
        created_at: trip.createdAt,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
    } else {
      console.log('Trip inserted successfully:', data);
    }

    return { data, error };
  },

  // 获取用户的所有Trips
  async getTrips(userId: string) {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error };

    const trips: Trip[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
    }));

    return { data: trips, error: null };
  },
};

// Credit管理相关函数
export const creditService = {
  // 获取用户credit
  async getCredits(userId: string) {
    const { data, error } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // 如果记录不存在，创建默认记录
      return await this.createCredits(userId, 10);
    }

    return { data: data?.credits || 10, error: error || null };
  },

  // 创建用户credit记录
  async createCredits(userId: string, initialCredits: number = 10) {
    const { data, error } = await supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        credits: initialCredits,
      })
      .select()
      .single();

    return { data: data?.credits || initialCredits, error };
  },

  // 消费credit（扫描发票：1个，AI audit：2个）
  async consumeCredits(userId: string, amount: number, type: 'scan' | 'audit') {
    const creditCost = type === 'scan' ? 1 : 2;
    const totalCost = amount * creditCost;

    // 先检查credit是否足够
    const { data: currentCredits, error: checkError } = await this.getCredits(userId);
    if (checkError) {
      return { success: false, error: checkError, remainingCredits: 0 };
    }

    if (currentCredits < totalCost) {
      return {
        success: false,
        error: { message: `Insufficient credits. Need ${totalCost}, have ${currentCredits}` },
        remainingCredits: currentCredits,
      };
    }

    // 扣除credit
    const { data, error } = await supabase
      .from('user_credits')
      .update({ credits: currentCredits - totalCost })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { success: false, error, remainingCredits: currentCredits };
    }

    // 记录credit使用历史
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: -totalCost,
      type: type,
      description: type === 'scan' ? `Scanned ${amount} invoice(s)` : `AI audited ${amount} invoice(s)`,
    });

    return {
      success: true,
      error: null,
      remainingCredits: data.credits,
    };
  },

  // 添加credit（购买等）
  async addCredits(userId: string, amount: number, description?: string) {
    const { data: currentCredits, error: checkError } = await this.getCredits(userId);
    if (checkError) {
      return { success: false, error: checkError, remainingCredits: 0 };
    }

    const { data, error } = await supabase
      .from('user_credits')
      .update({ credits: currentCredits + amount })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { success: false, error, remainingCredits: currentCredits };
    }

    // 记录credit交易历史
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: amount,
      type: 'purchase',
      description: description || `Purchased ${amount} credits`,
    });

    return {
      success: true,
      error: null,
      remainingCredits: data.credits,
    };
  },
};


import { GoogleGenAI, Type } from "@google/genai";
import { Expense } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Primary and Fallback models
const PRIMARY_MODEL = 'gemini-3-pro-preview';
const FALLBACK_MODEL = 'gemini-2.5-flash';

// Helper to try primary model, then fallback
async function generateContentWithFallback(params: any) {
  try {
    return await ai.models.generateContent({
      model: PRIMARY_MODEL,
      ...params
    });
  } catch (error) {
    console.warn(`Gemini Service: ${PRIMARY_MODEL} failed. Retrying with ${FALLBACK_MODEL}. Error:`, error);
    // Retry with fallback
    return await ai.models.generateContent({
      model: FALLBACK_MODEL,
      ...params
    });
  }
}

export const parseReceiptImage = async (base64Data: string, mimeType: string = 'image/png'): Promise<Partial<Expense>> => {
  if (!process.env.API_KEY) {
    console.warn("API Key is missing. Returning mock data.");
    return mockParse();
  }

  try {
    const response = await generateContentWithFallback({
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `Analyze this receipt/invoice. Extract the following details:
            - Merchant Name
            - Date (YYYY-MM-DD format)
            - Total Amount
            - Tax Amount (if visible/applicable)
            - Currency (e.g., CNY, USD, JPY, KRW, THB)
            - Category (Classify into one of: "Travel", "Meals", "Office", "Transport", "Lodging". If unsure, leave empty).
            
            Return the data in JSON format.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            date: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            tax: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            category: { type: Type.STRING },
          },
          required: ["merchant", "amount", "currency"],
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    const data = JSON.parse(text);
    
    // Basic post-processing
    return {
      merchant: data.merchant || "Unknown Merchant",
      date: data.date || new Date().toISOString().split('T')[0],
      amount: data.amount || 0,
      tax: data.tax || 0,
      currency: data.currency || "CNY",
      category: data.category || undefined, 
      status: data.category ? 'valid' : 'warning',
      warningMessage: data.category ? undefined : 'Missing category.',
    };

  } catch (error) {
    console.error("Gemini API Error (All models failed):", error);
    return mockParse();
  }
};

// New function for deep audit analysis
export const auditReceipt = async (base64Data: string, currentData: Expense, mimeType: string = 'image/png'): Promise<Partial<Expense>> => {
  if (!process.env.API_KEY) {
    return mockAudit();
  }

  try {
    const response = await generateContentWithFallback({
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType, 
              data: base64Data
            }
          },
          {
            text: `You are a strict corporate expense auditor. Analyze this receipt/invoice.
            
            1. Language & Nature: If the receipt is non-English (Chinese, Japanese, Korean, Thai, etc.), translate the key items and summarize the "Nature of Purchase" in English. Be specific (e.g., "Dinner with client - Sashimi and Sake" instead of just "Meals").
            2. Financials: Confirm the Total Amount and Tax Amount found on the document.
            3. RESTRICTED ITEM CHECK (CRITICAL): Scan line items for:
               - Alcohol (Beer, Wine, Sake, Liquor, Shochu, Highball)
               - Tobacco / Cigarettes
               - Entertainment / Karaoke
               - Gaming
            
            Return JSON.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            natureOfPurchase: { 
                type: Type.STRING, 
                description: "A concise English summary of what was bought, translating local text if necessary." 
            },
            detectedTax: { type: Type.NUMBER },
            detectedTotal: { type: Type.NUMBER },
            isPersonalExpense: { 
                type: Type.BOOLEAN, 
                description: "True if alcohol, tobacco, or non-reimbursable items are found." 
            },
            auditWarning: { 
                type: Type.STRING, 
                description: "If personal items are found, list them here (e.g. 'Contains Beer (Asahi) and Cigarettes'). Otherwise empty." 
            }
          },
          required: ["natureOfPurchase", "isPersonalExpense"],
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini Audit");
    
    const data = JSON.parse(text);

    return {
        aiAuditRan: true,
        aiAnalysis: `${data.natureOfPurchase} (Tax: ${data.detectedTax || 0})`,
        tax: data.detectedTax || currentData.tax, // Update tax if audit finds it better
        isPersonalExpense: data.isPersonalExpense,
        auditWarning: data.isPersonalExpense ? data.auditWarning : undefined
    };

  } catch (error) {
      console.error("Gemini Audit Error (All models failed)", error);
      return mockAudit();
  }
};

const mockParse = async (): Promise<Partial<Expense>> => {
  await new Promise(resolve => setTimeout(resolve, 1500)); 
  return {
    merchant: "Mock Restaurant (AI Failed)",
    date: new Date().toISOString().split('T')[0],
    amount: Math.floor(Math.random() * 500) + 50,
    tax: Math.floor(Math.random() * 50),
    currency: "CNY",
    category: undefined,
    status: 'warning',
    warningMessage: 'Missing category.'
  };
};

const mockAudit = async (): Promise<Partial<Expense>> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const isPersonal = Math.random() > 0.7;
    return {
        aiAuditRan: true,
        aiAnalysis: "Mock Audit: Dinner with team. (AI Offline)",
        isPersonalExpense: isPersonal,
        auditWarning: isPersonal ? "Potential Alcohol detected (Mock)." : undefined
    };
};
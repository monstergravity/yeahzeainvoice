import { GoogleGenAI, Type } from "@google/genai";
import { CreditCardTransaction } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const PRIMARY_MODEL = 'gemini-3-pro-preview';
const FALLBACK_MODEL = 'gemini-2.5-flash';

async function generateContentWithFallback(params: any) {
  try {
    return await ai.models.generateContent({
      model: PRIMARY_MODEL,
      ...params
    });
  } catch (error) {
    console.warn(`Bill Parser: ${PRIMARY_MODEL} failed. Retrying with ${FALLBACK_MODEL}. Error:`, error);
    return await ai.models.generateContent({
      model: FALLBACK_MODEL,
      ...params
    });
  }
}

/**
 * Parse credit card statement PDF using LLM
 * Converts any bank format to standardized structure
 */
export const parseBillPDF = async (base64Data: string, mimeType: string = 'application/pdf'): Promise<{
  transactions: CreditCardTransaction[];
  cardNumberSuffix?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  bankName?: string;
}> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
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
            text: `You are a financial statement parser. Analyze this credit card statement PDF.

Extract ALL transactions and convert them to a standardized format.

For each transaction, extract:
- date: Transaction date (YYYY-MM-DD format)
- amount: Transaction amount (positive for charges, negative for credits/refunds)
- merchant: Merchant name (clean and normalize, remove transaction codes/numbers)
- currency: Currency code (USD, CNY, etc.)
- description: Full original description from statement
- transaction_type: One of "purchase", "refund", "fee", "payment"
- reference_number: Transaction reference/ID if available
- location: Location/city if available

Also extract:
- card_number_suffix: Last 4 digits of card
- billing_period_start: Start date of billing period (YYYY-MM-DD)
- billing_period_end: End date of billing period (YYYY-MM-DD)
- bank_name: Name of the bank (Chase, Bank of America, Amex, etc.)

Return standardized JSON format.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bank_name: { type: Type.STRING },
            card_number_suffix: { type: Type.STRING },
            billing_period_start: { type: Type.STRING },
            billing_period_end: { type: Type.STRING },
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  merchant: { type: Type.STRING },
                  currency: { type: Type.STRING },
                  description: { type: Type.STRING },
                  transaction_type: { type: Type.STRING },
                  reference_number: { type: Type.STRING },
                  location: { type: Type.STRING },
                },
                required: ["date", "amount", "merchant"]
              }
            }
          },
          required: ["transactions"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text);

    // Convert to CreditCardTransaction format
    const transactions: CreditCardTransaction[] = (data.transactions || []).map((t: any, index: number) => ({
      id: `cc_${Date.now()}_${index}`,
      userId: '', // Will be set by caller
      date: t.date || new Date().toISOString(),
      merchant: t.merchant || 'Unknown',
      amount: Math.abs(t.amount || 0),
      currency: t.currency || 'USD',
      transactionType: (t.transaction_type || (t.amount < 0 ? 'refund' : 'purchase')) as 'purchase' | 'refund' | 'fee' | 'payment',
      description: t.description || t.merchant,
      referenceNumber: t.reference_number,
      location: t.location,
      matchStatus: 'unmatched',
      rawData: t // Store original data
    }));

    return {
      transactions,
      cardNumberSuffix: data.card_number_suffix,
      billingPeriodStart: data.billing_period_start,
      billingPeriodEnd: data.billing_period_end,
      bankName: data.bank_name
    };
  } catch (error) {
    console.error("Bill Parser Error:", error);
    throw error;
  }
};

/**
 * Parse credit card statement text (from OCR or CSV)
 * Uses LLM to normalize and structure the data
 */
export const parseBillText = async (text: string): Promise<{
  transactions: CreditCardTransaction[];
  cardNumberSuffix?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  bankName?: string;
}> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  try {
    const response = await generateContentWithFallback({
      contents: {
        parts: [
          {
            text: `You are a financial statement parser. Analyze this credit card statement text.

Extract ALL transactions and convert them to a standardized format.

For each transaction, extract:
- date: Transaction date (YYYY-MM-DD format)
- amount: Transaction amount (positive for charges, negative for credits/refunds)
- merchant: Merchant name (clean and normalize, remove transaction codes/numbers)
- currency: Currency code (USD, CNY, etc.)
- description: Full original description from statement
- transaction_type: One of "purchase", "refund", "fee", "payment"
- reference_number: Transaction reference/ID if available
- location: Location/city if available

Also extract:
- card_number_suffix: Last 4 digits of card
- billing_period_start: Start date of billing period (YYYY-MM-DD)
- billing_period_end: End date of billing period (YYYY-MM-DD)
- bank_name: Name of the bank (Chase, Bank of America, Amex, etc.)

Statement text:
${text}

Return standardized JSON format.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bank_name: { type: Type.STRING },
            card_number_suffix: { type: Type.STRING },
            billing_period_start: { type: Type.STRING },
            billing_period_end: { type: Type.STRING },
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  merchant: { type: Type.STRING },
                  currency: { type: Type.STRING },
                  description: { type: Type.STRING },
                  transaction_type: { type: Type.STRING },
                  reference_number: { type: Type.STRING },
                  location: { type: Type.STRING },
                },
                required: ["date", "amount", "merchant"]
              }
            }
          },
          required: ["transactions"]
        }
      }
    });

    const textResponse = response.text;
    if (!textResponse) throw new Error("No response from Gemini");

    const data = JSON.parse(textResponse);

    // Convert to CreditCardTransaction format
    const transactions: CreditCardTransaction[] = (data.transactions || []).map((t: any, index: number) => ({
      id: `cc_${Date.now()}_${index}`,
      userId: '', // Will be set by caller
      date: t.date || new Date().toISOString(),
      merchant: t.merchant || 'Unknown',
      amount: Math.abs(t.amount || 0),
      currency: t.currency || 'USD',
      transactionType: (t.transaction_type || (t.amount < 0 ? 'refund' : 'purchase')) as 'purchase' | 'refund' | 'fee' | 'payment',
      description: t.description || t.merchant,
      referenceNumber: t.reference_number,
      location: t.location,
      matchStatus: 'unmatched',
      rawData: t
    }));

    return {
      transactions,
      cardNumberSuffix: data.card_number_suffix,
      billingPeriodStart: data.billing_period_start,
      billingPeriodEnd: data.billing_period_end,
      bankName: data.bank_name
    };
  } catch (error) {
    console.error("Bill Text Parser Error:", error);
    throw error;
  }
};


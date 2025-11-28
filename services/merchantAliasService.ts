/**
 * Merchant Alias Database
 * Maps various merchant name formats to canonical names
 * Helps with fuzzy matching between credit card statements and invoices
 */

interface MerchantAlias {
  canonical: string;
  aliases: string[];
  category?: string;
}

// Merchant alias database
const MERCHANT_ALIASES: MerchantAlias[] = [
  // Coffee & Food
  {
    canonical: "Starbucks",
    aliases: ["STARBUCKS", "STARBUCKS COFFEE", "SBUX", "星巴克", "STARBUCKS STORE", "STARBUCKS*"],
    category: "Meals"
  },
  {
    canonical: "McDonald's",
    aliases: ["MCDONALDS", "MCD", "麦当劳", "MCDONALD"],
    category: "Meals"
  },
  {
    canonical: "KFC",
    aliases: ["KENTUCKY FRIED CHICKEN", "肯德基"],
    category: "Meals"
  },
  
  // Transportation
  {
    canonical: "Didi",
    aliases: ["DIDI", "滴滴出行", "DIDI*RIDE", "DIDI*TRAVEL", "滴滴"],
    category: "Transport"
  },
  {
    canonical: "Uber",
    aliases: ["UBER", "UBER*TRIP", "UBER EATS"],
    category: "Transport"
  },
  {
    canonical: "Lyft",
    aliases: ["LYFT", "LYFT*RIDE"],
    category: "Transport"
  },
  
  // Technology
  {
    canonical: "Apple",
    aliases: ["APPLE", "APL*ITUNES.COM", "APPLE STORE", "APPLE.COM", "苹果"],
    category: "Office"
  },
  {
    canonical: "Amazon",
    aliases: ["AMAZON", "AMZN", "AMAZON.COM", "AMAZON MARKETPLACE"],
    category: "Office"
  },
  
  // Hotels
  {
    canonical: "Marriott",
    aliases: ["MARRIOTT", "MARRIOTT HOTEL", "MARRIOTT*"],
    category: "Lodging"
  },
  {
    canonical: "Hilton",
    aliases: ["HILTON", "HILTON HOTEL", "HILTON*"],
    category: "Lodging"
  },
  
  // Airlines
  {
    canonical: "United Airlines",
    aliases: ["UNITED", "UNITED AIRLINES", "UAL"],
    category: "Travel"
  },
  {
    canonical: "Delta Airlines",
    aliases: ["DELTA", "DELTA AIRLINES", "DAL"],
    category: "Travel"
  },
  {
    canonical: "American Airlines",
    aliases: ["AMERICAN AIRLINES", "AMERICAN", "AAL"],
    category: "Travel"
  },
];

/**
 * Normalize merchant name using alias database
 */
export const normalizeMerchantName = (merchant: string): string => {
  const normalized = merchant.trim();
  
  // Check alias database
  for (const alias of MERCHANT_ALIASES) {
    const normalizedLower = normalized.toLowerCase();
    for (const aliasName of alias.aliases) {
      if (normalizedLower.includes(aliasName.toLowerCase()) || 
          aliasName.toLowerCase().includes(normalizedLower)) {
        return alias.canonical;
      }
    }
  }
  
  // If no match, return cleaned version
  return normalized
    .replace(/\*.*$/, '') // Remove transaction codes after *
    .replace(/\d{4,}/g, '') // Remove long number sequences
    .trim();
};

/**
 * Get merchant category from alias database
 */
export const getMerchantCategory = (merchant: string): string | undefined => {
  const normalized = merchant.trim().toLowerCase();
  
  for (const alias of MERCHANT_ALIASES) {
    for (const aliasName of alias.aliases) {
      if (normalized.includes(aliasName.toLowerCase()) || 
          aliasName.toLowerCase().includes(normalized)) {
        return alias.category;
      }
    }
  }
  
  return undefined;
};

/**
 * Calculate fuzzy string similarity (0-1)
 * Uses multiple algorithms for better accuracy
 */
export const calculateStringSimilarity = (str1: string, str2: string): number => {
  const s1 = normalizeMerchantName(str1).toLowerCase();
  const s2 = normalizeMerchantName(str2).toLowerCase();
  
  // Exact match
  if (s1 === s2) return 1.0;
  
  // One contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    return 0.9 * (shorter.length / longer.length);
  }
  
  // Common substring (at least 5 chars)
  const minLength = Math.min(s1.length, s2.length);
  if (minLength >= 5) {
    for (let len = minLength; len >= 5; len--) {
      for (let i = 0; i <= s1.length - len; i++) {
        const substr = s1.substring(i, i + len);
        if (s2.includes(substr)) {
          return 0.7 + (len / minLength) * 0.2;
        }
      }
    }
  }
  
  // First 5 characters match
  if (s1.length >= 5 && s2.length >= 5 && s1.substring(0, 5) === s2.substring(0, 5)) {
    return 0.6;
  }
  
  // Levenshtein distance (simplified)
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  
  let matches = 0;
  const minLen = Math.min(s1.length, s2.length);
  for (let i = 0; i < minLen; i++) {
    if (s1[i] === s2[i]) matches++;
  }
  
  return matches / maxLen;
};

/**
 * Add custom merchant alias (for user-specific mappings)
 */
export const addCustomAlias = (canonical: string, alias: string, category?: string) => {
  const existing = MERCHANT_ALIASES.find(m => m.canonical === canonical);
  if (existing) {
    if (!existing.aliases.includes(alias)) {
      existing.aliases.push(alias);
    }
    if (category) existing.category = category;
  } else {
    MERCHANT_ALIASES.push({
      canonical,
      aliases: [alias],
      category
    });
  }
};


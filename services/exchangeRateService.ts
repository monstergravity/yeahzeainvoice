export type CurrencyCode = 'CNY' | 'USD' | 'JPY' | 'KRW';

const API_URL = 'https://api.exchangerate.host/latest?base=CNY&symbols=USD,JPY,KRW';

export interface ExchangeRateResponse {
  CNY: number;
  USD: number;
  JPY: number;
  KRW: number;
}

export const fetchExchangeRates = async (): Promise<ExchangeRateResponse> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
  }

  const data = await response.json();
  const rates = data.rates || {};
  return {
    CNY: 1,
    USD: rates.USD || 0,
    JPY: rates.JPY || 0,
    KRW: rates.KRW || 0,
  };
};


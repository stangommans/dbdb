export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' }
];

// Base currency is EUR. Rates relative to EUR.
export const EXCHANGE_RATES: Record<string, number> = {
  EUR: 1.0,
  USD: 1.08,
  GBP: 0.85
};

export function convertToBase(amount: number, fromCurrency: string): number {
  const rate = EXCHANGE_RATES[fromCurrency.toUpperCase()] || 1.0;
  return amount / rate;
}

export function convertFromBase(amountInBase: number, toCurrency: string): number {
  const rate = EXCHANGE_RATES[toCurrency.toUpperCase()] || 1.0;
  return amountInBase * rate;
}

export function convertBetween(amount: number, fromCurrency: string, toCurrency: string): number {
  const amountInBase = convertToBase(amount, fromCurrency);
  return convertFromBase(amountInBase, toCurrency);
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode.toUpperCase()) || CURRENCIES[0];
  const formattedAmount = amount.toFixed(2);
  return `${currency.symbol}${formattedAmount}`;
}

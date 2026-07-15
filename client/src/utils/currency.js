/** Supported invoice currencies — locale drives Intl.NumberFormat output. */
export const CURRENCIES = ['USD', 'INR'];

const LOCALE_BY_CURRENCY = {
  USD: 'en-US',
  INR: 'en-IN',
};

export function getLocaleForCurrency(currency = 'USD') {
  return LOCALE_BY_CURRENCY[currency] || LOCALE_BY_CURRENCY.USD;
}

export function formatCurrency(amount, currency = 'USD', options = {}) {
  const code = CURRENCIES.includes(currency) ? currency : 'USD';
  return new Intl.NumberFormat(getLocaleForCurrency(code), {
    style: 'currency',
    currency: code,
    ...options,
  }).format(Number(amount));
}

/** Mirrors client currency helpers for email formatting. */
const LOCALE_BY_CURRENCY = {
  USD: 'en-US',
  INR: 'en-IN',
};

const SUPPORTED = ['USD', 'INR'];

export function formatCurrency(amount, currency = 'USD') {
  const code = SUPPORTED.includes(currency) ? currency : 'USD';
  const locale = LOCALE_BY_CURRENCY[code] || LOCALE_BY_CURRENCY.USD;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
  }).format(Number(amount));
}

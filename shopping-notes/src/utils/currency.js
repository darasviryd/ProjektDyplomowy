export const CURRENCIES = [
    { code: 'PLN', symbol: 'zł' },
    { code: 'EUR', symbol: '€' },
    { code: 'USD', symbol: '$' },
    { code: 'GBP', symbol: '£' },
  ];
  
  export function currencySymbol(code) {
    return CURRENCIES.find(c => c.code === code)?.symbol || code;
  }
  
  export function formatMoney(amount, code) {
    const n = Number(amount) || 0;
    return `${Math.round(n * 100) / 100} ${currencySymbol(code)}`;
  }

  export function formatCurrencyTotals(totals = {}) {
    const parts = Object.entries(totals)
      .filter(([, amount]) => Number(amount) > 0)
      .map(([code, amount]) => formatMoney(amount, code));

    return parts.length ? parts.join(' + ') : '0 zł';
  }

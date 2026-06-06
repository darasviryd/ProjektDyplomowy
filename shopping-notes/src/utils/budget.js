const roundMoney = (value) => Math.round(value * 100) / 100;

export const itemCurrency = (item, fallbackCurrency = 'PLN') => (
  item?.currency || fallbackCurrency || 'PLN'
);

export const calculateTotal = (items = [], currency, fallbackCurrency = 'PLN') => {
  const total = items.reduce((sum, i) => {
    if (currency && itemCurrency(i, fallbackCurrency) !== currency) return sum;
    const price = Number(i.price) || 0;
    const qty = Number(i.quantity) || 0;
    return sum + price * qty;
  }, 0);

  return roundMoney(total);
};

export const calculateTotalsByCurrency = (items = [], fallbackCurrency = 'PLN') => {
  const totals = {};

  items.forEach(i => {
    const code = itemCurrency(i, fallbackCurrency);
    const price = Number(i.price) || 0;
    const qty = Number(i.quantity) || 0;
    totals[code] = roundMoney((totals[code] || 0) + price * qty);
  });

  return totals;
};

// Budżet 0 или пустой = "нет лимита"
export const isBudgetExceeded = (items = [], limit, currency, fallbackCurrency = 'PLN') => {
  const l = Number(limit);
  if (!Number.isFinite(l) || l <= 0) return false;
  return calculateTotal(items, currency, fallbackCurrency) > l;
};

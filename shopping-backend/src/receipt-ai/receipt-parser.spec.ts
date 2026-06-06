import { parseReceiptText } from './receipt-parser';

describe('parseReceiptText', () => {
  it('recognizes product names, prices and receipt total', () => {
    const result = parseReceiptText(`
      MLEKO 3,66
      PIECZARKI 4,99
      FILET KURCZAKA 25,00
      BOROWKA 10,99
      SUMA 44,64 zl
    `);

    expect(result.items).toHaveLength(4);
    expect(result.items[0]).toMatchObject({ name: 'MLEKO', price: 3.66, quantity: 1, total: 3.66 });
    expect(result.receiptTotal).toBe(44.64);
    expect(result.parsedTotal).toBe(44.64);
    expect(result.currency).toBe('PLN');
  });

  it('keeps the original currency from receipt text', () => {
    const result = parseReceiptText(`
      Coffee 2 x 4,50 9,00 EUR
      Razem 9,00 EUR
    `);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ name: 'Coffee', price: 4.5, quantity: 2, total: 9, currency: 'EUR' });
    expect(result.receiptTotal).toBe(9);
    expect(result.parsedTotal).toBe(9);
    expect(result.currency).toBe('EUR');
  });
});

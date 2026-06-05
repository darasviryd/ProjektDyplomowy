const CURRENCY_BY_SYMBOL: Record<string, string> = {
  'zł': 'PLN',
  pln: 'PLN',
  eur: 'EUR',
  '€': 'EUR',
  usd: 'USD',
  '$': 'USD',
};

const SKIP_PATTERNS = [
  /paragon/i,
  /fiskal/i,
  /\bnip\b/i,
  /\bregon\b/i,
  /\bptu\b/i,
  /\bvat\b/i,
  /sprzedaż/i,
  /sprzedaz/i,
  /kasa/i,
  /kasjer/i,
  /terminal/i,
  /płatność/i,
  /platnosc/i,
  /gotówka/i,
  /gotowka/i,
  /karta/i,
  /reszta/i,
  /dziękuj/i,
  /dziekuj/i,
  /adres/i,
  /data/i,
  /godz/i,
];

const TOTAL_PATTERNS = [
  /suma/i,
  /razem/i,
  /do zapłaty/i,
  /do zaplaty/i,
  /należność/i,
  /naleznosc/i,
];

export type ParsedReceiptItem = {
  name: string;
  price: number;
  quantity: number;
  currency: string;
  total: number;
};

export type ParsedReceipt = {
  items: ParsedReceiptItem[];
  receiptTotal: number;
  parsedTotal: number;
  currency: string;
  source: 'ai-image' | 'text-parser';
};

function toNumber(value: string | number | undefined): number {
  const n = Number(String(value || '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function detectCurrency(line: string, fallback = 'PLN'): string {
  const lower = String(line || '').toLowerCase();
  const found = Object.entries(CURRENCY_BY_SYMBOL).find(([symbol]) => lower.includes(symbol));
  return found ? found[1] : fallback;
}

function cleanName(value: string): string {
  return String(value || '')
    .replace(/\b\d+[,.]\d{2}\b\s*(zł|pln|eur|usd|€|\$)?/gi, '')
    .replace(/\b\d+[,.]?\d*\s*[xX*]\s*\d+[,.]\d{2}\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9]+/, '')
    .trim();
}

function isSkippableLine(line: string): boolean {
  if (!line || line.length < 3) return true;
  return SKIP_PATTERNS.some(pattern => pattern.test(line));
}

function parseItemLine(line: string, fallbackCurrency: string): ParsedReceiptItem | null {
  const priceMatch = line.match(/(-?\d+[,.]\d{2})\s*(zł|pln|eur|usd|€|\$)?\s*$/i);
  if (!priceMatch) return null;

  const total = toNumber(priceMatch[1]);
  if (total <= 0) return null;

  let quantity = 1;
  let unitPrice = total;
  const quantityMatch = line.match(/(\d+[,.]?\d*)\s*[xX*]\s*(\d+[,.]\d{2})/);
  if (quantityMatch) {
    const q = toNumber(quantityMatch[1]);
    const unit = toNumber(quantityMatch[2]);
    if (q > 0 && unit > 0) {
      quantity = q;
      unitPrice = unit;
    }
  }

  const name = cleanName(line.slice(0, priceMatch.index));
  if (!name || TOTAL_PATTERNS.some(pattern => pattern.test(name))) return null;

  return {
    name,
    price: unitPrice,
    quantity,
    currency: detectCurrency(line, fallbackCurrency),
    total,
  };
}

export function parseReceiptText(text = '', fallbackCurrency = 'PLN'): ParsedReceipt {
  const lines = String(text)
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const items: ParsedReceiptItem[] = [];
  let receiptTotal = 0;
  let currency = fallbackCurrency || 'PLN';

  lines.forEach(line => {
    currency = detectCurrency(line, currency);

    const totalLine = TOTAL_PATTERNS.some(pattern => pattern.test(line));
    const lastPrice = line.match(/(\d+[,.]\d{2})\s*(zł|pln|eur|usd|€|\$)?\s*$/i);
    if (totalLine && lastPrice) {
      receiptTotal = toNumber(lastPrice[1]);
      return;
    }

    if (isSkippableLine(line)) return;

    const item = parseItemLine(line, currency);
    if (item) items.push(item);
  });

  if (!items.length && receiptTotal > 0) {
    items.push({
      name: 'Paragon',
      price: receiptTotal,
      quantity: 1,
      currency,
      total: receiptTotal,
    });
  }

  const parsedTotal = Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;

  return {
    items,
    receiptTotal,
    parsedTotal,
    currency,
    source: 'text-parser',
  };
}

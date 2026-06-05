import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { ShoppingItemService } from '../shopping-items/shopping-items.service';
import { ShoppingListService } from '../shopping-lists/shopping-lists.service';
import { parseReceiptText, ParsedReceipt, ParsedReceiptItem } from './receipt-parser';

type AnalyzePayload = {
  imageBase64?: string;
  mimeType?: string;
  ocrText?: string;
  currency?: string;
};

type ImportPayload = AnalyzePayload & {
  listId?: string;
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function loadLocalEnv() {
  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx < 0) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (key) {
      process.env[key] = value;
    }
  });
}

function envValue(key: string): string | undefined {
  loadLocalEnv();
  return process.env[key];
}

function normalizeAiItem(item: any, fallbackCurrency: string): ParsedReceiptItem | null {
  const name = String(item?.name || '').trim();
  const price = Number(item?.price);
  const quantity = Number(item?.quantity || 1);
  const currency = String(item?.currency || fallbackCurrency || 'PLN').toUpperCase();

  if (!name || !Number.isFinite(price) || price <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
    return null;
  }

  return {
    name,
    price: Math.round(price * 100) / 100,
    quantity,
    currency,
    total: Math.round(price * quantity * 100) / 100,
  };
}

function cleanAiErrorMessage(message?: string): string {
  const text = String(message || '').trim();
  const lower = text.toLowerCase();

  if (lower.includes('is not found for api version') || lower.includes('not supported for generatecontent')) {
    return 'Wybrany model Gemini nie obsługuje analizy zdjęć. Usuń GEMINI_VISION_MODEL z .env albo ustaw gemini-2.0-flash.';
  }

  if (lower.includes('quota') || lower.includes('rate-limit') || lower.includes('rate limit')) {
    return 'Limit darmowego Gemini API został wykorzystany. Wklej tekst z paragonu i użyj analizy tekstowej albo podaj aktywny klucz GEMINI_API_KEY.';
  }

  if (lower.includes('api key') || lower.includes('permission') || lower.includes('unauthorized')) {
    return 'Klucz API do analizy zdjęć jest nieaktywny albo nie ma dostępu do Gemini. Sprawdź GEMINI_API_KEY w pliku .env backendu.';
  }

  return text || 'Nie udało się przeanalizować paragonu.';
}

@Injectable()
export class ReceiptAiService {
  constructor(
    private readonly listsService: ShoppingListService,
    private readonly itemsService: ShoppingItemService,
  ) {}

  async analyze(payload: AnalyzePayload): Promise<ParsedReceipt> {
    try {
      return await this.analyzeSafe(payload);
    } catch (e: any) {
      if (e instanceof BadRequestException) {
        throw e;
      }

      console.error('Receipt AI error:', e);
      throw new BadRequestException(cleanAiErrorMessage(e?.message));
    }
  }

  private async analyzeSafe(payload: AnalyzePayload): Promise<ParsedReceipt> {
    const fallbackCurrency = payload.currency || 'PLN';

    if (payload.imageBase64 && envValue('GEMINI_API_KEY')) {
      try {
        return await this.analyzeImageWithGemini(payload.imageBase64, payload.mimeType || 'image/jpeg', fallbackCurrency);
      } catch (e: any) {
        if (!payload.ocrText) {
          throw new BadRequestException(cleanAiErrorMessage(e?.message));
        }
      }
    }

    if (payload.ocrText) {
      return parseReceiptText(payload.ocrText, fallbackCurrency);
    }

    throw new BadRequestException(
      'Brak tekstu paragonu. Analiza zdjęcia wymaga skonfigurowania GEMINI_API_KEY.',
    );
  }

  async importToList(userId: number, payload: ImportPayload) {
    if (!payload.listId) {
      throw new BadRequestException('Brak listy zakupów.');
    }

    const lists = await this.listsService.findAllByUser(userId);
    const list = lists.find(l => l.id === payload.listId);
    if (!list) {
      throw new BadRequestException('Lista nie należy do zalogowanego użytkownika.');
    }

    const result = await this.analyze({ ...payload, currency: payload.currency || list.currency || 'PLN' });
    const now = new Date();

    const created = [];
    for (const item of result.items) {
      created.push(await this.itemsService.create({
        id: generateId(),
        name: item.name,
        price: item.price,
        currency: item.currency || list.currency || 'PLN',
        quantity: item.quantity || 1,
        description: 'Dodano z paragonu AI',
        url: '',
        imageUrl: '',
        priority: 'normal',
        bought: true,
        updatedAt: now,
        list: { id: list.id } as any,
      }));
    }

    return {
      ...result,
      createdCount: created.length,
      items: created.map(item => ({ ...item, listId: list.id })),
    };
  }

  private parseAiJson(content: string, fallbackCurrency: string, source: 'ai-image'): ParsedReceipt {
    const jsonText = String(content || '')
      .replace(/^```json/i, '')
      .replace(/^```/i, '')
      .replace(/```$/i, '')
      .trim();
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText || '{}');
    } catch {
      throw new Error('AI nie zwróciło poprawnego JSON z produktami.');
    }
    const items = (parsed.items || [])
      .map((item: any) => normalizeAiItem(item, parsed.currency || fallbackCurrency))
      .filter(Boolean) as ParsedReceiptItem[];

    const parsedTotal = Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
    const receiptTotal = Number(parsed.receiptTotal) || parsedTotal;
    const currency = String(parsed.currency || items[0]?.currency || fallbackCurrency || 'PLN').toUpperCase();

    return {
      items,
      receiptTotal: Math.round(receiptTotal * 100) / 100,
      parsedTotal,
      currency,
      source,
    };
  }

  private async analyzeImageWithGemini(imageBase64: string, mimeType: string, fallbackCurrency: string): Promise<ParsedReceipt> {
    const models = await this.getGeminiModels();
    const cleanBase64 = imageBase64.includes(',')
      ? imageBase64.split(',').pop() || imageBase64
      : imageBase64;
    let lastError = '';

    for (const model of models) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${envValue('GEMINI_API_KEY')}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            generationConfig: {
              temperature: 0,
              response_mime_type: 'application/json',
            },
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text:
                      'Odczytaj paragon zakupowy. Zwróć wyłącznie JSON w formacie: {"items":[{"name":"...","price":1.23,"quantity":1,"currency":"PLN"}],"receiptTotal":1.23,"currency":"PLN"}. Pomijaj NIP, VAT, numer paragonu, kasjera, płatność kartą i techniczne linie. Domyślna waluta: ' +
                      fallbackCurrency,
                  },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: cleanBase64,
                    },
                  },
                ],
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        let message = `Gemini HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          message = errorData?.error?.message || message;
        } catch {}
        lastError = message;
        continue;
      }

      const data = await response.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        lastError = 'Gemini nie zwrócił tekstu z rozpoznanymi produktami.';
        continue;
      }
      return this.parseAiJson(content || '{}', fallbackCurrency, 'ai-image');
    }

    throw new Error(cleanAiErrorMessage(lastError));
  }

  private async getGeminiModels(): Promise<string[]> {
    const selectedModel = envValue('GEMINI_VISION_MODEL');
    const fallbackModels = ['gemini-2.0-flash', 'gemini-2.0-flash-001', 'gemini-2.5-flash'];

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${envValue('GEMINI_API_KEY')}`);
      if (!response.ok) {
        return Array.from(new Set([selectedModel, ...fallbackModels].filter(Boolean))) as string[];
      }

      const data = await response.json();
      const available = (data?.models || [])
        .filter((model: any) => (model?.supportedGenerationMethods || []).includes('generateContent'))
        .map((model: any) => String(model?.name || '').replace(/^models\//, ''))
        .filter((name: string) => name.includes('flash'));

      return Array.from(new Set([
        selectedModel,
        ...available,
        ...fallbackModels,
      ].filter(Boolean))) as string[];
    } catch {
      return Array.from(new Set([selectedModel, ...fallbackModels].filter(Boolean))) as string[];
    }
  }

}

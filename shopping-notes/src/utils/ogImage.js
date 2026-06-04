export function extractUrl(text) {
  if (!text) return text;
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : text;
}

export async function fetchOgImage(url) {
  if (!url || !url.startsWith('http')) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let html;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ShoppingBot/1.0)' },
        signal: controller.signal,
      });
      html = await res.text();
    } finally {
      clearTimeout(timeout);
    }

    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    ];

    for (const pattern of patterns) {
      const m = html.match(pattern);
      if (m && m[1] && m[1].startsWith('http')) return m[1];
    }
    return null;
  } catch {
    return null;
  }
}

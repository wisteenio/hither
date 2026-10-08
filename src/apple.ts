// Everything this project needs to know about Apple lives in this file.
//
// 1. Every app has a numeric ID (e.g. 1232780281). It's the same in every country.
// 2. Apple runs a separate App Store per country ("storefront"), identified by a
//    two-letter code in the URL: apps.apple.com/us/..., apps.apple.com/jp/...
// 3. Apple's public lookup endpoint tells us whether an app is sold in a given
//    country: it returns resultCount 0 when the app isn't in that store.

export interface ParsedAppLink {
  id: string;
  /** Country code found in the pasted URL, if any (lowercase). */
  country: string | null;
}

/**
 * Accepts anything a creator might paste:
 *   https://apps.apple.com/us/app/some-name/id1232780281?mt=8
 *   https://apps.apple.com/app/id1232780281
 *   apps.apple.com/us/app/id1232780281
 *   https://itunes.apple.com/jp/app/id1232780281
 *   id1232780281
 *   1232780281
 */
export function parseAppStoreLink(input: string): ParsedAppLink | null {
  const text = input.trim();
  if (/^(id)?\d{5,12}$/i.test(text)) {
    return { id: text.replace(/^id/i, ""), country: null };
  }

  let url: URL;
  try {
    url = new URL(/^(?:apps|itunes)\.apple\.com\//i.test(text) ? "https://" + text : text);
  } catch {
    return null;
  }
  if (!/(^|\.)(apps|itunes)\.apple\.com$/i.test(url.hostname)) return null;

  const idMatch = url.pathname.match(/\/id(\d{5,12})(\/|$)/i);
  if (!idMatch) return null;

  const countryMatch = url.pathname.match(/^\/([a-z]{2})\//i);
  return { id: idMatch[1], country: countryMatch ? countryMatch[1].toLowerCase() : null };
}

export function storeUrl(country: string, appId: string): string {
  return `https://apps.apple.com/${country}/app/id${appId}`;
}

export type LookupResult =
  | { status: "available"; name: string; iconUrl: string | null }
  | { status: "unavailable" }
  | { status: "error" };

/**
 * Asks Apple whether the app is sold in `country`.
 * Responses are cached at Cloudflare's edge for a day, so Apple is only asked
 * about each app/country pair occasionally — the endpoint is rate-limited.
 */
export async function lookupApp(
  appId: string,
  country: string,
  fetchImpl: typeof fetch = fetch,
): Promise<LookupResult> {
  const url = `https://itunes.apple.com/lookup?id=${encodeURIComponent(appId)}&country=${encodeURIComponent(country)}`;
  try {
    const res = await fetchImpl(url, {
      cf: { cacheTtl: 86400, cacheEverything: true },
    } as RequestInit);
    if (!res.ok) return { status: "error" };
    const data = (await res.json()) as {
      resultCount?: number;
      results?: Array<{ trackName?: string; artworkUrl512?: string; artworkUrl100?: string }>;
    };
    if (!data.resultCount || !data.results?.length) return { status: "unavailable" };
    const app = data.results[0];
    return {
      status: "available",
      name: app.trackName ?? "This app",
      iconUrl: app.artworkUrl512 ?? app.artworkUrl100 ?? null,
    };
  } catch {
    return { status: "error" };
  }
}

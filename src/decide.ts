import { type LookupResult, storeUrl } from "./apple";

export type Platform = "ios" | "android" | "other";

/**
 * Where to look when the app isn't sold in the visitor's country.
 * Most apps are in the US store, so that's checked first; the rest are large stores.
 */
export const FALLBACK_ORDER = [
  "us", "gb", "ca", "au", "de", "fr", "jp", "kr", "cn", "in",
  "br", "mx", "es", "it", "nl", "sg", "hk", "tw",
];

export type Decision =
  | { kind: "redirect"; url: string }
  | {
      kind: "unavailable";
      country: string;
      fallbackCountry: string;
      appName: string;
      iconUrl: string | null;
    }
  | { kind: "not_found" };

export function detectPlatform(userAgent: string | null): Platform {
  const ua = userAgent ?? "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "other";
}

/**
 * Cloudflare sets request.cf.country to an ISO code like "JP".
 * "XX" means unknown and "T1" means Tor, so we treat those as unknown.
 */
export function normalizeCountry(raw: unknown): string | null {
  if (typeof raw !== "string" || !/^[A-Za-z]{2}$/.test(raw)) return null;
  const cc = raw.toLowerCase();
  if (cc === "xx" || cc === "t1") return null;
  return cc;
}

/** Finds the first store in FALLBACK_ORDER that sells the app. */
export async function findFallback(
  lookup: (country: string) => Promise<LookupResult>,
  skip: string | null = null,
): Promise<{ country: string; name: string; iconUrl: string | null } | null> {
  for (const cc of FALLBACK_ORDER) {
    if (cc === skip) continue;
    const result = await lookup(cc);
    if (result.status === "available") return { country: cc, name: result.name, iconUrl: result.iconUrl };
  }
  return null;
}

/** Decides where a click on yoursite.com/<appId> should go. */
export async function decide(
  appId: string,
  country: string | null,
  platform: Platform,
  lookup: (country: string) => Promise<LookupResult>,
): Promise<Decision> {
  // Unknown visitor country: Apple's own country-less link lets Apple pick the store.
  if (!country) {
    return { kind: "redirect", url: `https://apps.apple.com/app/id${appId}` };
  }

  const own = await lookup(country);
  // Sold here, or Apple unreachable: send them to their own country's page.
  if (own.status !== "unavailable") {
    return { kind: "redirect", url: storeUrl(country, appId) };
  }

  const fallback = await findFallback(lookup, country);
  if (!fallback) return { kind: "not_found" };

  // On iPhone/iPad the App Store app always opens the visitor's own country store,
  // so redirecting to another country would just show Apple's "not available" error.
  // Show our page instead, with a button to the fallback store.
  if (platform === "ios") {
    return {
      kind: "unavailable",
      country,
      fallbackCountry: fallback.country,
      appName: fallback.name,
      iconUrl: fallback.iconUrl,
    };
  }
  // Computers and Android can view any country's web page.
  return { kind: "redirect", url: storeUrl(fallback.country, appId) };
}

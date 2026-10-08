import { describe, expect, it } from "vitest";
import { lookupApp, parseAppStoreLink } from "../src/apple";
import { decide, detectPlatform, normalizeCountry } from "../src/decide";
import { homePage } from "../src/pages";

describe("parseAppStoreLink", () => {
  it("reads id and country from a full link", () => {
    expect(parseAppStoreLink("https://apps.apple.com/jp/app/some-app/id1232780281?mt=8")).toEqual({
      id: "1232780281",
      country: "jp",
    });
  });
  it("handles links without a country", () => {
    expect(parseAppStoreLink("https://apps.apple.com/app/id1232780281")).toEqual({ id: "1232780281", country: null });
  });
  it.each([
    ["apps.apple.com/us/app/id1232780281", "us"],
    ["  apps.apple.com/app/id1232780281  ", null],
    ["itunes.apple.com/DE/app/demo/id1232780281?mt=8", "de"],
  ])("handles App Store links without a protocol: %s", (input, country) => {
    expect(parseAppStoreLink(input)).toEqual({ id: "1232780281", country });
  });
  it("handles old itunes links and bare ids", () => {
    expect(parseAppStoreLink("https://itunes.apple.com/DE/app/id123456")?.country).toBe("de");
    expect(parseAppStoreLink("id123456789")).toEqual({ id: "123456789", country: null });
    expect(parseAppStoreLink("123456789")).toEqual({ id: "123456789", country: null });
  });
  it("rejects other sites and junk", () => {
    expect(parseAppStoreLink("https://evil.example.com/us/app/id123456")).toBeNull();
    expect(parseAppStoreLink("https://apps.apple.com/us/app/no-id-here")).toBeNull();
    expect(parseAppStoreLink("hello")).toBeNull();
    expect(parseAppStoreLink("apps.apple.com.evil.example/us/app/id123456")).toBeNull();
    expect(parseAppStoreLink("evil.example/apps.apple.com/us/app/id123456")).toBeNull();
    expect(parseAppStoreLink("apps.apple.com/us/app/no-id-here")).toBeNull();
  });
});

describe("detectPlatform / normalizeCountry", () => {
  it("detects devices", () => {
    expect(detectPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe("ios");
    expect(detectPlatform("Mozilla/5.0 (Linux; Android 15; Pixel 9)")).toBe("android");
    expect(detectPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)")).toBe("other");
    expect(detectPlatform(null)).toBe("other");
  });
  it("normalizes Cloudflare country codes", () => {
    expect(normalizeCountry("JP")).toBe("jp");
    expect(normalizeCountry("XX")).toBeNull();
    expect(normalizeCountry("T1")).toBeNull();
    expect(normalizeCountry(undefined)).toBeNull();
  });
});

describe("decide", () => {
  type R = Awaited<ReturnType<typeof lookupApp>>;
  // Fake App Store: the app is sold in the given countries.
  const soldIn = (countries: string[]) => async (cc: string): Promise<R> =>
    countries.includes(cc) ? { status: "available", name: "Demo", iconUrl: "icon.png" } : { status: "unavailable" };

  it("lets Apple pick the store when the visitor's country is unknown", async () => {
    expect(await decide("111", null, "ios", soldIn([]))).toEqual({
      kind: "redirect",
      url: "https://apps.apple.com/app/id111",
    });
  });
  it("sends visitors to their own country's store when the app is sold there", async () => {
    expect(await decide("111", "jp", "ios", soldIn(["jp"]))).toEqual({
      kind: "redirect",
      url: "https://apps.apple.com/jp/app/id111",
    });
  });
  it("still redirects to the visitor's country when Apple can't be reached", async () => {
    expect(await decide("111", "fr", "other", async () => ({ status: "error" }) as R)).toEqual({
      kind: "redirect",
      url: "https://apps.apple.com/fr/app/id111",
    });
  });

  describe("when the app isn't sold in the visitor's country", () => {
    it("sends computers to the US store when the app is sold there", async () => {
      expect(await decide("111", "cn", "other", soldIn(["jp", "us"]))).toEqual({
        kind: "redirect",
        url: "https://apps.apple.com/us/app/id111",
      });
    });
    it("tries the next big store when the app isn't in the US", async () => {
      expect(await decide("111", "cn", "other", soldIn(["jp"]))).toEqual({
        kind: "redirect",
        url: "https://apps.apple.com/jp/app/id111",
      });
    });
    it("sends Android to the fallback store page", async () => {
      expect(await decide("111", "cn", "android", soldIn(["us"]))).toEqual({
        kind: "redirect",
        url: "https://apps.apple.com/us/app/id111",
      });
    });
    it("shows iPhone users the friendly page pointing at the fallback store", async () => {
      expect(await decide("111", "cn", "ios", soldIn(["gb"]))).toEqual({
        kind: "unavailable",
        country: "cn",
        fallbackCountry: "gb",
        appName: "Demo",
        iconUrl: "icon.png",
      });
    });
    it("reports not found when the app isn't sold anywhere we check", async () => {
      expect(await decide("111", "cn", "other", soldIn([]))).toEqual({ kind: "not_found" });
    });
  });
});

describe("lookupApp", () => {
  const fakeFetch = (payload: unknown, ok = true) =>
    (async () => new Response(JSON.stringify(payload), { status: ok ? 200 : 503 })) as unknown as typeof fetch;

  it("reports available apps with name and icon", async () => {
    const r = await lookupApp("1", "us", fakeFetch({ resultCount: 1, results: [{ trackName: "Hum", artworkUrl512: "x.png" }] }));
    expect(r).toEqual({ status: "available", name: "Hum", iconUrl: "x.png" });
  });
  it("reports unavailable when Apple returns no results", async () => {
    expect(await lookupApp("1", "cn", fakeFetch({ resultCount: 0, results: [] }))).toEqual({ status: "unavailable" });
  });
  it("reports errors", async () => {
    expect(await lookupApp("1", "us", fakeFetch({}, false))).toEqual({ status: "error" });
  });
});

describe("homePage", () => {
  it("points the link preview at the domain it was served from", () => {
    const page = homePage("https://hither.example");
    expect(page).toContain('<meta property="og:image" content="https://hither.example/og.png?v=2">');
    expect(page).toContain('<div class="from">hither.example/1232780281</div>');
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";

const SITE = "https://hither.link";

afterEach(() => vi.restoreAllMocks());

describe("search metadata", () => {
  it("consolidates a homepage with tracking parameters to the clean root URL", async () => {
    const response = await worker.fetch(new Request(`${SITE}/?utm_source=launch`));
    const page = await response.text();
    const canonical = page.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
    expect(response.status).toBe(200);
    expect(canonical).toBe("https://hither.link/");
    expect(response.headers.get("x-robots-tag")).toBeNull();
  });

  it("describes the site with parseable WebSite structured data on the homepage", async () => {
    const response = await worker.fetch(new Request(`${SITE}/`));
    const page = await response.text();
    const data = page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    expect(data).toBeDefined();
    expect(JSON.parse(data!)).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Hither",
      url: "https://hither.link/",
    });
  });
});

describe("crawler responses", () => {
  it("serves homepage HEAD with the same status and headers as GET and no body", async () => {
    const get = await worker.fetch(new Request(`${SITE}/`));
    const head = await worker.fetch(new Request(`${SITE}/`, { method: "HEAD" }));
    expect(head.status).toBe(get.status);
    expect([...head.headers]).toEqual([...get.headers]);
    expect(await head.text()).toBe("");
  });

  it.each(["GET", "HEAD"])("keeps %s app links temporary and out of the index", async (method) => {
    const response = await worker.fetch(new Request(`${SITE}/1232780281`, { method }));
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://apps.apple.com/app/id1232780281");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, follow");
    expect(await response.text()).toBe("");
  });

  it("keeps the app lookup payload usable while excluding the API from search results", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      resultCount: 1,
      results: [{ trackId: 1232780281, trackName: "Demo app", artworkUrl512: "https://example.com/icon.png" }],
    })));
    const response = await worker.fetch(new Request(`${SITE}/api/app/1232780281`));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, follow");
    expect(await response.json()).toEqual({ id: "1232780281", name: "Demo app", iconUrl: "https://example.com/icon.png" });
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { parseHTML } from "linkedom";
import worker from "../src/index";
import { homePage } from "../src/pages";

const SITE = "https://hither.link";
const UNPUBLISHED_ID = "6811533642";
const unconfirmed = () => new Response(JSON.stringify({ id: UNPUBLISHED_ID, name: null, iconUrl: null }));

// Exercise the script that the Worker actually ships, with a real DOM and a controlled network.
function maker(fetchApp: typeof fetch) {
  const html = homePage(SITE);
  const { document, Event } = parseHTML(html);
  const copied: string[] = [];
  const script = html.match(/<script>([\s\S]*?)<\/script>/)![1];
  new Function("document", "location", "matchMedia", "fetch", "navigator", script)(
    document, { origin: SITE }, () => ({ matches: true }), fetchApp,
    { clipboard: { writeText: async (text: string) => { copied.push(text); } } },
  );
  return {
    document,
    copied,
    submit(input: string) {
      document.getElementById("app-url").value = input;
      document.getElementById("maker").dispatchEvent(new Event("submit", { cancelable: true }));
    },
  };
}

afterEach(() => vi.restoreAllMocks());

describe("link maker", () => {
  it("makes a link immediately while Apple information is still loading", () => {
    const page = maker(() => new Promise<Response>(() => {}));
    page.submit("https://apps.apple.com/app/id6811533642");
    expect(page.document.getElementById("hither-link")?.value).toBe("https://hither.link/6811533642");
    expect(Boolean(page.document.querySelector('#maker button[type="submit"]').disabled)).toBe(false);
    expect(page.document.getElementById("copy")).not.toBeNull();
  });

  it("keeps an unpublished app's link copyable and explains the unconfirmed status", async () => {
    const page = maker(async () => unconfirmed());
    page.submit(UNPUBLISHED_ID);
    await vi.waitFor(() => expect(page.document.querySelector(".result .hint")?.textContent ?? "").toMatch(/confirm|verify/i));
    expect(page.document.getElementById("hither-link").value).toBe("https://hither.link/6811533642");
    expect(page.document.querySelector("#out .error")).toBeNull();
    expect(page.document.querySelector(".result img")).toBeNull();
    page.document.getElementById("copy").click();
    await vi.waitFor(() => expect(page.copied).toEqual(["https://hither.link/6811533642"]));
  });

  it.each([
    ["an Apple lookup failure", async () => { throw new Error("Network unavailable"); }],
    ["an unsuccessful metadata response", async () => new Response("{}", { status: 503 })],
    ["an unreadable metadata response", async () => new Response("not JSON")],
  ])("keeps the link available after %s", async (_name, fetchApp) => {
    const page = maker(fetchApp);
    page.submit("id6811533642");
    await vi.waitFor(() => expect(page.document.querySelector(".result .hint")?.textContent ?? "").toMatch(/confirm|verify/i));
    expect(page.document.getElementById("hither-link").value).toBe("https://hither.link/6811533642");
    expect(page.document.querySelector("#out .error")).toBeNull();
  });

  it("adds the published app's name and icon without replacing its link", async () => {
    const page = maker(async () => new Response(JSON.stringify({
      id: "1232780281", name: "Published app", iconUrl: "https://example.com/icon.png",
    })));
    page.submit("https://apps.apple.com/jp/app/demo/id1232780281?mt=8");
    await vi.waitFor(() => expect(page.document.querySelector(".result strong")?.textContent).toBe("Published app"));
    expect(page.document.querySelector(".result img")?.getAttribute("src")).toBe("https://example.com/icon.png");
    expect(page.document.getElementById("hither-link").value).toBe("https://hither.link/1232780281");
  });

  it.each([
    "hello", "https://example.com/app/id6811533642", "https://apps.apple.com.evil.example/app/id6811533642",
    "https://evil.example/apps.apple.com/app/id6811533642", "https://apps.apple.com/app/no-id",
  ])("rejects malformed or non-Apple input: %s", (input) => {
    const fetchApp = vi.fn(async () => unconfirmed());
    const page = maker(fetchApp);
    page.submit(input);
    expect(page.document.querySelector('#out [role="alert"]')).not.toBeNull();
    expect(page.document.getElementById("hither-link")).toBeNull();
    expect(fetchApp).not.toHaveBeenCalled();
  });

  it("ignores an old lookup when another app link has been generated", async () => {
    let finishFirst!: (response: Response) => void;
    const first = new Promise<Response>((resolve) => { finishFirst = resolve; });
    const page = maker(vi.fn().mockReturnValueOnce(first).mockResolvedValue(unconfirmed()));
    page.submit("1232780281");
    page.submit(UNPUBLISHED_ID);
    await vi.waitFor(() => expect(page.document.querySelector(".result .hint")?.textContent ?? "").toMatch(/confirm|verify/i));
    finishFirst(new Response(JSON.stringify({ id: "1232780281", name: "Previous app", iconUrl: null })));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(page.document.getElementById("hither-link").value).toBe("https://hither.link/6811533642");
    expect(page.document.querySelector(".result strong")?.textContent).not.toBe("Previous app");
  });
});

describe("optional app metadata", () => {
  it.each([
    ["an unpublished app", () => Promise.resolve(new Response(JSON.stringify({ resultCount: 0, results: [] })))],
    ["an unreachable App Store", () => Promise.reject(new Error("Apple unavailable"))],
  ])("returns an unconfirmed description for %s", async (_name, lookup) => {
    vi.spyOn(globalThis, "fetch").mockImplementation(lookup);
    const response = await worker.fetch(new Request(`${SITE}/api/app/${UNPUBLISHED_ID}`));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: "6811533642", name: null, iconUrl: null });
  });
});

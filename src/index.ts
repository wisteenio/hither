// Hither: one App Store link for every country.
//
// A Hither link is just your domain plus the app's ID:  yoursite.com/1232780281
// The ID is the same in every country, so the same app always gets the same link,
// and there's nothing to store: everything else comes from Apple at click time.

import { lookupApp } from "./apple";
import { decide, detectPlatform, findFallback, normalizeCountry } from "./decide";
import { homePage, notFoundPage, unavailablePage } from "./pages";

const APP_PATH = /^\/(?:id)?(\d{5,12})\/?$/i;
const API_APP_PATH = /^\/api\/app\/(\d{5,12})$/;

function html(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Used by the home page to confirm an app exists and show its name and icon. */
async function describeApp(appId: string): Promise<Response> {
  const found = await findFallback((cc) => lookupApp(appId, cc));
  if (!found) return json({ error: "Couldn't find this app in the App Store." }, 404);
  return json({ id: appId, name: found.name, iconUrl: found.iconUrl });
}

async function followLink(appId: string, request: Request): Promise<Response> {
  const country = normalizeCountry((request as { cf?: { country?: unknown } }).cf?.country);
  const platform = detectPlatform(request.headers.get("user-agent"));

  const decision = await decide(appId, country, platform, (cc) => lookupApp(appId, cc));

  switch (decision.kind) {
    case "redirect":
      // 302 + no-store: every visitor may need a different destination.
      return new Response(null, {
        status: 302,
        headers: { location: decision.url, "cache-control": "no-store" },
      });
    case "unavailable":
      return html(unavailablePage(appId, decision));
    case "not_found":
      return html(notFoundPage(), 404);
  }
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "GET") return html(notFoundPage(), 404);
    const { pathname, origin } = new URL(request.url);

    if (pathname === "/") return html(homePage(origin));

    const api = pathname.match(API_APP_PATH);
    if (api) return describeApp(api[1]);

    const app = pathname.match(APP_PATH);
    if (app) return followLink(app[1], request);

    return html(notFoundPage(), 404);
  },
} satisfies ExportedHandler;

import { storeUrl } from "./apple";

const REPO_URL = "https://github.com/wisteenio/hither";
const X_HANDLE = "x_wio_x";
const X_URL = `https://x.com/${X_HANDLE}`;
const EXAMPLE_ID = "1232780281";
const DESCRIPTION = "Create one free App Store link for every country. Hither sends visitors to their local store and finds a fallback when your app isn't available.";

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

// ---------------------------------------------------------------------------
// Design tokens. Overpass comes from US highway signage: Hither is wayfinding.
// Signal yellow is reserved for the country code, the one thing Hither changes.
// ---------------------------------------------------------------------------
const styles = `
/* Self-hosted variable fonts (public/fonts), so no third party sees visitors' IPs.
   Other scripts, such as Japanese app names, fall back to system fonts. */
@font-face { font-family:"Overpass"; font-weight:100 900; font-display:swap;
  src:url(/fonts/overpass-latin-wght-normal.woff2) format("woff2"); unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD; }
@font-face { font-family:"Overpass"; font-weight:100 900; font-display:swap;
  src:url(/fonts/overpass-latin-ext-wght-normal.woff2) format("woff2"); unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF; }
@font-face { font-family:"Overpass Mono"; font-weight:300 700; font-display:swap;
  src:url(/fonts/overpass-mono-latin-wght-normal.woff2) format("woff2"); unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD; }
@font-face { font-family:"Overpass Mono"; font-weight:300 700; font-display:swap;
  src:url(/fonts/overpass-mono-latin-ext-wght-normal.woff2) format("woff2"); unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF; }
:root {
  --paper:#F3F5F8; --surface:#FFFFFF; --ink:#14213D; --muted:#5B6478; --line:#D9DEE7;
  --route:#2448E8; --route-ink:#FFFFFF; --signal:#FFC93C; --signal-ink:#14213D; --error:#B42318;
  --sans:"Overpass", system-ui, -apple-system, "Segoe UI", sans-serif;
  --mono:"Overpass Mono", ui-monospace, "SF Mono", Menlo, monospace;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --paper:#0F1626; --surface:#162038; --ink:#E8ECF4; --muted:#98A2B8; --line:#26304A;
    --route:#7C95FF; --route-ink:#0F1626; --error:#FF8A7A; color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --paper:#0F1626; --surface:#162038; --ink:#E8ECF4; --muted:#98A2B8; --line:#26304A;
  --route:#7C95FF; --route-ink:#0F1626; --error:#FF8A7A; color-scheme: dark;
}
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin:0; background:var(--paper); color:var(--ink); font:400 1.0625rem/1.6 var(--sans); }
a { color:var(--route); text-underline-offset:0.18em; }
:focus-visible { outline:3px solid var(--route); outline-offset:3px; border-radius:4px; }
.wrap { width:100%; max-width:68rem; margin:0 auto; padding:0 1.25rem; }
.measure { max-width:40rem; }
h1, h2, h3 { margin:0; line-height:1.1; letter-spacing:-0.015em; }
p { margin:0; }
.muted { color:var(--muted); }

/* Top bar */
.top { display:flex; align-items:center; justify-content:space-between; padding-top:1.25rem; padding-bottom:1.25rem; }
.brand { font-weight:800; font-size:1.25rem; color:var(--ink); text-decoration:none; letter-spacing:-0.02em; }
.top-links { display:flex; align-items:center; gap:1rem; }
.top-links a { display:inline-flex; align-items:center; justify-content:center;
  color:var(--muted); text-decoration:none; font-weight:600; }
.top-links a:hover { color:var(--ink); }
.top-links .social { position:relative; width:1.5rem; height:1.5rem; }
.top-links .social::before { content:""; position:absolute; inset:-0.625rem; }
.top-links .social:focus-visible { outline-offset:2px; }
/* Overpass's letterforms sit above the center of its line box. */
.top-links svg { display:block; width:1rem; height:1rem; fill:currentColor; transform:translateY(-2px); }

/* Hero */
.hero { padding-top:clamp(2.5rem, 8vw, 6rem); padding-bottom:clamp(3rem, 8vw, 5.5rem); }
.hero h1 { font-size:clamp(2.4rem, 6.2vw, 4.5rem); font-weight:800; max-width:14ch; }
.hero .lede { margin-top:1.25rem; font-size:1.25rem; line-height:1.5; color:var(--muted); max-width:34rem; }

/* The route: Hither link above, resolved Apple URL below */
.route { margin-top:clamp(2.5rem, 6vw, 4rem); font-family:var(--mono); }
.route .from { font-size:clamp(0.95rem, 2.2vw, 1.15rem); color:var(--muted); overflow-wrap:anywhere; }
.route .via { display:flex; align-items:center; gap:0.75rem; margin:0.6rem 0 0.6rem 0.4rem; font-family:var(--sans);
              font-size:0.95rem; color:var(--muted); }
.route .via::before { content:""; width:2px; height:2.25rem; background:var(--line); }
.route .to { font-size:clamp(0.95rem, 4.2vw, 2.35rem); font-weight:600; line-height:1.3; overflow-wrap:anywhere; }
.slot { display:inline-block; min-width:2.2ch; text-align:center; background:var(--signal); color:var(--signal-ink);
        border-radius:0.2em; padding:0 0.12em; }
.slot.flip { animation:flip 420ms cubic-bezier(.3,.7,.3,1); }
@keyframes flip { 0% { transform:rotateX(90deg); } 100% { transform:rotateX(0); } }
@media (prefers-reduced-motion: reduce) { .slot.flip { animation:none; } }

/* Link maker */
.maker { margin-top:clamp(2.5rem, 6vw, 3.5rem); max-width:44rem; }
.maker label { display:block; font-weight:700; margin-bottom:0.5rem; }
.field { display:flex; gap:0.5rem; flex-wrap:wrap; }
.field input { flex:1 1 18rem; min-width:0; }
input[type="text"], input[readonly] { width:100%; padding:0.85rem 1rem; font:inherit; color:var(--ink); background:var(--surface);
  border:1.5px solid var(--line); border-radius:10px; }
input[readonly] { font-family:var(--mono); font-size:1rem; }
input:focus { border-color:var(--route); outline:none; box-shadow:0 0 0 3px color-mix(in srgb, var(--route) 25%, transparent); }
.btn { display:inline-flex; align-items:center; justify-content:center; padding:0.85rem 1.35rem; font:700 1rem/1 var(--sans);
  color:var(--route-ink); background:var(--route); border:1.5px solid var(--route); border-radius:10px; cursor:pointer; text-decoration:none; }
.btn:hover { filter:brightness(1.08); }
.btn:disabled { opacity:0.6; cursor:progress; }
.btn.quiet { color:var(--ink); background:transparent; border-color:var(--line); }
@media (max-width: 34rem) { .field .btn { width:100%; } }
.hint { margin-top:0.6rem; font-size:0.9rem; color:var(--muted); }
.result { margin-top:1.25rem; padding:1.25rem; background:var(--surface); border:1.5px solid var(--line); border-radius:14px; }
.result .app { display:flex; align-items:center; gap:0.85rem; margin-bottom:1rem; }
.result .app img { width:52px; height:52px; border-radius:12px; }
.result .app strong { font-size:1.1rem; }
.result .actions { display:flex; gap:0.5rem; margin-top:0.75rem; flex-wrap:wrap; }
.error { margin-top:1rem; color:var(--error); font-weight:600; }

/* Sections */
section.band { padding:clamp(3rem, 8vw, 5rem) 0; border-top:1px solid var(--line); }
section.band h2 { font-size:clamp(1.6rem, 3.4vw, 2.1rem); font-weight:800; }
section.band .intro { margin-top:0.75rem; color:var(--muted); font-size:1.125rem; }
.steps { list-style:none; margin:2.25rem 0 0; padding:0; display:grid; gap:2rem;
         grid-template-columns:repeat(auto-fit, minmax(15rem, 1fr)); counter-reset:step; }
.steps li { counter-increment:step; }
.steps li::before { content:counter(step); display:grid; place-items:center; width:2.25rem; height:2.25rem; margin-bottom:0.9rem;
  border:2px solid var(--ink); border-radius:50%; font-weight:800; }
.steps h3 { font-size:1.2rem; font-weight:700; margin-bottom:0.4rem; }
.steps p { color:var(--muted); }

.devices { margin-top:2rem; border-collapse:collapse; width:100%; max-width:46rem; }
.devices th, .devices td { text-align:left; vertical-align:top; padding:1rem 1.25rem 1rem 0; border-bottom:1px solid var(--line); }
.devices th { width:11rem; font-weight:700; }
.devices td { color:var(--muted); }
@media (max-width: 34rem) {
  .devices, .devices tbody, .devices tr, .devices th, .devices td { display:block; width:auto; }
  .devices th { padding-bottom:0.25rem; border:0; }
  .devices td { padding-top:0; }
}

.faq { margin-top:1.75rem; max-width:46rem; }
.faq details { border-bottom:1px solid var(--line); }
.faq summary { cursor:pointer; list-style:none; padding:1.1rem 2rem 1.1rem 0; font-weight:700; font-size:1.1rem; position:relative; }
.faq summary::-webkit-details-marker { display:none; }
.faq summary::after { content:"+"; position:absolute; right:0.25rem; top:0.95rem; font-size:1.4rem; font-weight:400; color:var(--muted); }
.faq details[open] summary::after { content:"\\2212"; }
.faq details p { padding:0 0 1.25rem; color:var(--muted); max-width:38rem; }

footer { padding:2rem 0 3rem; border-top:1px solid var(--line); color:var(--muted); font-size:0.95rem; }
footer .wrap { display:flex; gap:1rem 2rem; flex-wrap:wrap; justify-content:space-between; }

/* Single-message pages */
.solo { min-height:100vh; display:flex; flex-direction:column; }
.solo main { flex:1; display:flex; align-items:center; padding-top:2rem; padding-bottom:4rem; }
.solo .panel { max-width:30rem; }
.solo .panel img { width:96px; height:96px; border-radius:22px; margin-bottom:1.5rem; }
.solo h1 { font-size:clamp(1.8rem, 5vw, 2.4rem); font-weight:800; }
.solo p { margin:0.9rem 0 1.75rem; color:var(--muted); font-size:1.125rem; }
`;

function layout(title: string, body: string, extraHead = ""): string {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(DESCRIPTION)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/overpass-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<style>${styles}</style>${extraHead}
</head><body>${body}</body></html>`;
}

function topBar(): string {
  return `<header class="wrap top"><a class="brand" href="/">Hither</a>
    <nav class="top-links" aria-label="External links">
      <a class="social" href="${X_URL}" target="_blank" rel="me noopener noreferrer"
         aria-label="@${X_HANDLE} on X (opens in a new tab)" title="@${X_HANDLE} on X">
        <svg viewBox="0 0 1200 1227" aria-hidden="true" focusable="false"><path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"/></svg>
      </a>
      <a class="repo" href="${REPO_URL}">GitHub</a>
    </nav></header>`;
}

export function unavailablePage(
  appId: string,
  info: { country: string; fallbackCountry: string; appName: string; iconUrl: string | null },
): string {
  const icon = info.iconUrl ? `<img src="${escapeHtml(info.iconUrl)}" alt="">` : "";
  return layout(
    `${info.appName} isn't available in your region`,
    `<div class="solo">${topBar()}
      <main class="wrap"><div class="panel">
        ${icon}
        <h1>${escapeHtml(info.appName)}</h1>
        <p>This app isn't in the ${escapeHtml(countryName(info.country))} App Store yet. You can still see it in the ${escapeHtml(countryName(info.fallbackCountry))} App Store.</p>
        <a class="btn" href="${storeUrl(info.fallbackCountry, appId)}">View in the ${escapeHtml(countryName(info.fallbackCountry))} App Store</a>
      </div></main>
    </div>`,
  );
}

export function notFoundPage(): string {
  return layout(
    "App not found",
    `<div class="solo">${topBar()}
      <main class="wrap"><div class="panel">
        <h1>App not found</h1>
        <p>This link doesn't point to an app that's in the App Store right now.</p>
        <a class="btn quiet" href="/">Make a Hither link</a>
      </div></main>
    </div>`,
  );
}

// Client-side script for the home page. String.raw keeps the regexes readable.
const homeScript = String.raw`
(() => {
  // The split-flap country slot in the hero.
  const stops = [["jp","Japan"],["de","Germany"],["br","Brazil"],["kr","South Korea"],["fr","France"],["in","India"],["us","the United States"]];
  const slot = document.getElementById("slot"), where = document.getElementById("where");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let i = 0;
  if (!still) setInterval(() => {
    i = (i + 1) % stops.length;
    slot.classList.remove("flip"); void slot.offsetWidth; slot.classList.add("flip");
    slot.textContent = stops[i][0]; where.textContent = "A visitor in " + stops[i][1] + " goes to";
  }, 2200);

  // The link maker: a Hither link only needs the app's numeric ID.
  const parseId = (text) => {
    const t = text.trim();
    const bare = t.match(/^(?:id)?(\d{5,12})$/i);
    if (bare) return bare[1];
    try {
      const url = new URL(/^(?:apps|itunes)\.apple\.com\//i.test(t) ? "https://" + t : t);
      if (!/^https?:$/.test(url.protocol) || !/(^|\.)(apps|itunes)\.apple\.com$/i.test(url.hostname)) return null;
      const m = url.pathname.match(/\/id(\d{5,12})(?:\/|$)/i);
      return m ? m[1] : null;
    } catch {
      return null;
    }
  };
  const form = document.getElementById("maker"), input = document.getElementById("app-url");
  const out = document.getElementById("out");
  const showError = (message) => { out.innerHTML = '<p class="error" role="alert"></p>'; out.firstChild.textContent = message; };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = parseId(input.value);
    if (!id) { showError("Enter an App Store link or App ID, like id1232780281."); input.focus(); return; }
    const link = location.origin + "/" + id;
    out.innerHTML = '<div class="result"><div class="app"><strong></strong></div>'
      + '<label for="hither-link">Your Hither link</label><input id="hither-link" readonly>'
      + '<div class="actions"><button type="button" class="btn" id="copy">Copy link</button>'
      + '<a class="btn quiet" target="_blank" rel="noopener">Try it</a></div>'
      + '<p class="hint">Your link is ready. Checking public App Store information…</p></div>';
    out.querySelector("strong").textContent = "App ID " + id;
    const field = out.querySelector("#hither-link"); field.value = link;
    out.querySelector("a").href = link;
    const status = out.querySelector(".hint");
    const copy = out.querySelector("#copy");
    copy.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(link); } catch { field.select(); document.execCommand("copy"); }
      copy.textContent = "Copied"; setTimeout(() => { copy.textContent = "Copy link"; }, 1800);
    });

    // Metadata helps confirm the ID, but never gates link creation or copying.
    try {
      const res = await fetch("/api/app/" + id);
      const data = await res.json();
      if (out.querySelector("#hither-link") !== field) return;
      if (!res.ok || !data.name) throw new Error("Unconfirmed app");
      out.querySelector("strong").textContent = data.name;
      if (data.iconUrl) {
        const img = document.createElement("img"); img.alt = ""; img.src = data.iconUrl;
        out.querySelector(".app").prepend(img);
      }
      status.remove();
    } catch {
      if (out.querySelector("#hither-link") === field) {
        status.textContent = "We couldn't confirm this app's public App Store information. Check the App ID. If it hasn't launched yet, you can still prepare and copy this link.";
      }
    }
  });
})();
`;

// Search and sharing metadata for the homepage. og.png is committed (see docs/DESIGN.md).
function homeMeta(title: string, origin: string): string {
  const canonical = new URL("/", origin).href;
  const image = new URL("og.png", canonical).href;
  const imageAlt = "Hither: one App Store link for every country";
  const site = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Hither",
    url: canonical,
    description: DESCRIPTION,
    inLanguage: "en",
  });
  return `
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta name="robots" content="index, follow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Hither">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(DESCRIPTION)}">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:image:alt" content="${escapeHtml(imageAlt)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@${X_HANDLE}">
<meta name="twitter:creator" content="@${X_HANDLE}">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(DESCRIPTION)}">
<meta name="twitter:image" content="${escapeHtml(image)}">
<meta name="twitter:image:alt" content="${escapeHtml(imageAlt)}">
<script type="application/ld+json">${site}</script>`;
}

export function homePage(origin = "https://hither.link"): string {
  const title = "Hither — Free App Store Links for Every Country";
  const h = escapeHtml(new URL(origin).host);
  return layout(
    title,
    `${topBar()}
    <main>
      <section class="wrap hero">
        <h1>One App Store link for every country.</h1>
        <p class="lede">Share one link. Hither sends each visitor to the App Store in their own country, or to a store that has your app when theirs doesn't.</p>

        <div class="route" aria-label="Example: one Hither link becomes the right App Store link for each visitor">
          <div class="from">${h}/${EXAMPLE_ID}</div>
          <div class="via" id="where" aria-live="off">A visitor in Japan goes to</div>
          <div class="to">apps.apple.com/<span class="slot" id="slot">jp</span>/app/id${EXAMPLE_ID}</div>
        </div>

        <form class="maker" id="maker" novalidate>
          <label for="app-url">Paste your App Store link or App ID</label>
          <div class="field">
            <input type="text" id="app-url" inputmode="url" autocomplete="off" spellcheck="false"
                   placeholder="https://apps.apple.com/us/app/your-app/id123456789">
            <button class="btn" type="submit">Get my link</button>
          </div>
          <p class="hint">A link from any country works. The same app always gets the same Hither link. You can prepare it before launch.</p>
          <div id="out" aria-live="polite"></div>
        </form>
      </section>

      <section class="band">
        <div class="wrap">
          <div class="measure">
            <h2>How a click is routed</h2>
            <p class="intro">Every click is worked out fresh, in a few milliseconds, on the server nearest the visitor.</p>
          </div>
          <ol class="steps">
            <li><h3>Hither sees where the click came from</h3><p>Cloudflare reports the visitor's country with every request, so there's nothing for them to choose.</p></li>
            <li><h3>Hither asks Apple</h3><p>Apple's public lookup says whether your app is sold in that country. The answer is kept for a day, so later clicks are instant.</p></li>
            <li><h3>The visitor lands in the right store</h3><p>Hither fills in their country code and sends them to your app's page in their own App Store.</p></li>
          </ol>
        </div>
      </section>

      <section class="band">
        <div class="wrap">
          <div class="measure">
            <h2>When your app isn't sold there</h2>
            <p class="intro">Hither looks for another store automatically: the US first, then other large stores, until it finds one with your app. What happens next depends on the visitor's device.</p>
          </div>
          <table class="devices">
            <tbody>
              <tr><th scope="row">Computer</th><td>Goes straight to your app's page in that store.</td></tr>
              <tr><th scope="row">Android</th><td>Opens your app's App Store page in the browser, the same as on a computer. iPhone apps can't be installed on Android, so this only shows what your app is.</td></tr>
              <tr><th scope="row">iPhone and iPad</th><td>Sees a short page with your app's icon and name, and a button to that store. The App Store app can only open the visitor's own country, so a redirect would end in Apple's "not available" message.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="band">
        <div class="wrap">
          <h2>Questions</h2>
          <div class="faq">
            <details><summary>Is it free?</summary><p>Yes. Hither runs on Cloudflare's free plan, and the code is open source under the MIT license.</p></details>
            <details><summary>Do I need an account?</summary><p>No. Paste a link and copy the result. Links don't expire and there's nothing to manage.</p></details>
            <details><summary>Does Hither store my links?</summary><p>No. A Hither link holds only your app's ID. Everything else comes from Apple when someone clicks, so nobody can change where your link goes.</p></details>
            <details><summary>What if I paste a link from a different country?</summary><p>You get the same Hither link. The app ID is identical in every country, and that's all the link contains.</p></details>
            <details><summary>Can I get a link before my app launches?</summary><p>Yes. Paste the Apple ID from your app's App Information page in App Store Connect. You can prepare and copy your Hither link before uploading a build or publishing. Visitors can reach the store page after your app is publicly available. Hither caches store information for up to a day, so release detection may be delayed.</p></details>
            <details><summary>Can I run my own copy?</summary><p>Yes. The code is on <a href="${REPO_URL}">GitHub</a> and deploys to your own Cloudflare account in a few minutes.</p></details>
          </div>
        </div>
      </section>
    </main>
    <footer><div class="wrap"><span>Hither is free and open source.</span><a href="${REPO_URL}">View the code on GitHub</a></div></footer>
    <script>${homeScript}</script>`,
    homeMeta(title, origin),
  );
}

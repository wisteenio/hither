# Hither

One App Store link for every country. Free, open-source Cloudflare Worker.
Repo: https://github.com/wisteenio/hither (MIT).

## How it works

- A link is `<domain>/<appId>` (e.g. `/1232780281`, `/id1232780281` also accepted). The app ID is the same in every country, so the same app always gets the same link. **No database, no accounts, nothing stored.** Keep it that way unless the owner decides otherwise: shared, first-come links with user-supplied data (Play links, custom names) were removed on purpose because anyone could hijack them.
- On click: visitor country from `request.cf.country`, device from User-Agent. Apple's public lookup endpoint (`itunes.apple.com/lookup?id=…&country=…`, `resultCount: 0` = not sold there) decides availability; responses are edge-cached for a day via `fetch(..., { cf: { cacheTtl } })`.
- Sold in visitor's country → that country's store. Not sold → fall back automatically to the US store, then the next store in `FALLBACK_ORDER` that has the app. Computers/Android are redirected there; iPhone/iPad get a friendly page with a button (the App Store app always opens the visitor's own Apple ID country, so redirecting them elsewhere is a dead end). Unknown country → Apple's country-less URL. Apple unreachable → visitor's own country URL.

## Layout

- `src/apple.ts`: Apple-specific code (lookup, store URLs, link parsing)
- `src/decide.ts`: pure routing logic, where most behavior lives and is tested
- `src/pages.ts`: home page (link maker, client-side ID parsing) and "not available" page
- `src/index.ts`: routes `GET /`, `GET /api/app/:id`, `GET /:id`
- `public/`: static files served by Cloudflare before the Worker (self-hosted fonts, site icon, link preview image, `_headers`)
- `test/logic.test.ts`: Vitest

## Design

- Before changing anything visual in `src/pages.ts`, read `docs/DESIGN.md` (tokens, components, states, motion, accessibility, change checklist).

## Commands

- `npm test`, `npm run typecheck`, `npm run dev` (local: no real visitor country, so links use the country-less URL), `npm run deploy`

## Conventions

- Keep behavior changes covered in `test/logic.test.ts`; logic belongs in `decide.ts`, not `index.ts`.
- Free plan constraints: stay well under 50 subrequests per click (the fallback loop stops at the first hit).
- The owner is new to Cloudflare and the Apple ecosystem: explain dashboard steps plainly and ask before anything that costs money (domains, paid plans).

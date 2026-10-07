# Hither

**One App Store link for every country.** Free and open source, runs on Cloudflare Workers. No database, no accounts.

Live: https://hither.link

## The problem

App Store web links include a country code (`apps.apple.com/us/app/...`). If your app is only sold in some countries, a visitor from anywhere else lands on a dead end or Apple's homepage. Making a separate link for every country isn't realistic.

## The idea

Every app has a numeric ID that's the same in every country. The only thing that changes between countries is the two-letter code in the URL. So a Hither link is simply:

```
hither.link/1232780281
```

Paste your App Store link from any country and you always get the same link for the same app. There's nothing to store and nothing anyone can change: all information comes from Apple at click time.

## How a click works

1. The Worker reads the visitor's country (Cloudflare provides it on every request) and device.
2. It asks Apple's public lookup endpoint whether the app is sold in that country. Answers are cached at the edge for a day, so Apple is only asked occasionally.
3. Then:
   - **Sold there:** the visitor goes to their own country's App Store page.
   - **Not sold there:** Hither falls back automatically to the US store, or if the app isn't in the US, the next large store that has it (UK, Canada, Australia, Germany, Japan, …).
     - Computers and Android are redirected straight to that page.
     - iPhone and iPad visitors see a friendly page (icon, name, button to that store), because their App Store app can only show their own country.
   - **Country unknown:** Apple's own country-less link, so Apple picks the store.
   - **Apple unreachable:** the visitor's own country page, rather than an error.

## Project layout

```
src/apple.ts    Everything Apple-specific: the lookup endpoint, store URLs
src/decide.ts   Where should this click go? (pure logic, fully tested)
src/pages.ts    The get-a-link page and the "not available" page
src/index.ts    Routes: GET /, GET /api/app/:id, GET /:id
```

## Run it locally

```bash
npm install
npm test
npm run dev
```

Open http://localhost:8787 and paste an App Store link. Locally there is no real visitor country, so links use Apple's country-less URL; deploy to see geo redirects.

## Deploy your own (free tier)

```bash
npx wrangler login
CLOUDFLARE_ACCOUNT_ID=your-account-id npm run deploy
```

The production custom domain is `hither.link`. `wrangler.toml` binds it to the Worker and disables temporary `workers.dev` and preview URLs. To deploy your own copy, change the domain in `wrangler.toml` to an active domain in your Cloudflare account.

Account IDs and API tokens belong in environment variables or GitHub Secrets, never in source files.

### Automatic deploys from GitHub

`.github/workflows/deploy.yml` runs the tests and deploys on every push to `main`. Add two repository secrets:

- `CLOUDFLARE_API_TOKEN`: a token made from the "Edit Cloudflare Workers" template
- `CLOUDFLARE_ACCOUNT_ID`: shown in your Cloudflare dashboard

## Cost

On Cloudflare's free plan a Worker handles 100,000 requests per day, and going over makes requests fail until the daily reset rather than creating a bill.

## Roadmap ideas

- Google Play links and custom short names, with a way to prove you own the app
- QR code for each link

## License

MIT

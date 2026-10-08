# Handoff spec: Hither site

The design as shipped in commit `a50c218`. The source of truth for values is `src/pages.ts`. This document explains what each part is, why it's that way, and what to keep intact when changing it.

## Overview

Hither's site is a single page plus two message pages, all rendered as HTML strings by the Worker (no framework, no build step, no client-side libraries).

| Page | Route | Job |
|---|---|---|
| Home | `GET /` | Explain Hither in one glance and turn a pasted App Store link into a Hither link |
| Not available | `GET /:id` (iPhone/iPad, app not sold in visitor's country) | Tell the visitor the app isn't in their store and offer the fallback store |
| Not found | `GET /:id` (app not sold anywhere checked), unknown paths | Say the link doesn't lead to an app, offer a way back |

**Audience:** indie app developers who will paste a link once and share the result. Visitors who click a Hither link mostly never see the site at all: they are redirected.

**Design idea:** Hither is wayfinding. The page shows the product working (a Hither link resolving to a country store) instead of describing it, uses a typeface derived from US highway signage, and reserves one signal color for the one thing Hither changes: the country code.

## Layout

- One column, **left-aligned**, centered container `.wrap`: `max-width: 68rem`, side gutter `1.25rem` (20px).
- Reading text is capped: `.measure` at `40rem`, tables and FAQ at `46rem`, FAQ answers at `38rem`, hero lede at `34rem`, link maker at `44rem`.
- Home page order: top bar, hero (headline, lede, route demo, link maker), "How a click is routed", "When your app isn't sold there", "Questions", footer.
- Sections below the hero (`section.band`) are separated by a 1px `--line` rule on top, never by background color changes or cards.

> **Gotcha.** `.wrap` provides the side gutter with `padding-left/right`. Elements that also carry `.wrap` (`.top`, `.hero`, `.solo main`) must set **only** `padding-top`/`padding-bottom`. A `padding: X 0` shorthand removes the gutter and makes content touch the screen edge on phones. This bug was fixed twice during the redesign.

### Vertical rhythm

| Where | Value |
|---|---|
| Hero top | `clamp(2.5rem, 8vw, 6rem)` |
| Hero bottom | `clamp(3rem, 8vw, 5.5rem)` |
| Section top and bottom | `clamp(3rem, 8vw, 5rem)` |
| Route demo top margin | `clamp(2.5rem, 6vw, 4rem)` |
| Link maker top margin | `clamp(2.5rem, 6vw, 3.5rem)` |
| Heading to intro | `0.75rem` |
| Intro to steps / table / FAQ | `2.25rem` / `2rem` / `1.75rem` |

## Design tokens

All tokens are CSS custom properties on `:root`.

### Color

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--paper` | `#F3F5F8` | `#0F1626` | Page background |
| `--surface` | `#FFFFFF` | `#162038` | Inputs, result panel |
| `--ink` | `#14213D` | `#E8ECF4` | Headings, body text, step circles |
| `--muted` | `#5B6478` | `#98A2B8` | Lede, descriptions, hints, footer |
| `--line` | `#D9DEE7` | `#26304A` | Rules, input borders, route connector |
| `--route` | `#2448E8` | `#7C95FF` | Primary buttons, links, focus ring |
| `--route-ink` | `#FFFFFF` | `#0F1626` | Text on primary buttons |
| `--signal` | `#FFC93C` | `#FFC93C` | **Only** the country code slot: in the hero, as the site icon, and in the preview image |
| `--signal-ink` | `#14213D` | `#14213D` | Text on the signal slot |
| `--error` | `#B42318` | `#FF8A7A` | Error messages |

Dark mode follows the device setting. `data-theme="light"` or `data-theme="dark"` on `<html>` forces either theme (no toggle is shipped).

**Rule:** `--signal` is reserved for the country slot. The site icon and the link preview image are that slot, so they use it too; on the page itself, nothing but the hero slot is yellow. Its meaning is "the part Hither fills in"; a second yellow element weakens the hero.

#### Contrast (WCAG 2.1)

| Pair | Light | Dark |
|---|---|---|
| ink on paper | 14.6:1 | 15.2:1 |
| muted on paper | 5.4:1 | 7.0:1 |
| muted on surface | 5.9:1 | 6.3:1 |
| button text on route | 6.6:1 | 6.5:1 |
| route link on paper | 6.1:1 | 6.5:1 |
| error on paper | 6.0:1 | 7.9:1 |
| signal-ink on signal | 10.4:1 | 10.4:1 |

All pass AA for normal text. Re-check if any color changes.

### Typography

Self-hosted from `public/fonts` (Cloudflare static assets, OFL license alongside): **Overpass** and **Overpass Mono** as variable fonts, Latin and Latin Extended subsets only, `font-display: swap`. The `@font-face` rules are at the top of `styles` in `src/pages.ts`; the Latin Overpass file is preloaded. Text in other scripts (for example Japanese app names) uses system fonts. Fonts make no third-party requests; the only one on the site is the app icon in the link maker result, which loads from Apple (`mzstatic.com`).

| Token / role | Spec |
|---|---|
| `--sans` | Overpass, then system UI fonts |
| `--mono` | Overpass Mono, then system monospace. **Only for text that is literally a URL.** |
| Body | 400, `1.0625rem` (17px), line-height 1.6 |
| H1 (hero) | 800, `clamp(2.4rem, 6.2vw, 4.5rem)`, line-height 1.1, tracking `-0.015em`, `max-width: 14ch` (breaks into two lines) |
| H2 (sections) | 800, `clamp(1.6rem, 3.4vw, 2.1rem)` |
| H3 (steps) | 700, `1.2rem` |
| Lede | 400, `1.25rem`, line-height 1.5, muted |
| Section intro | 400, `1.125rem`, muted |
| Route "to" URL | Mono 600, `clamp(0.95rem, 4.2vw, 2.35rem)` |
| Route "from" URL | Mono 400, `clamp(0.95rem, 2.2vw, 1.15rem)`, muted |
| Hint, footer | `0.9rem` / `0.95rem`, muted |
| Brand | 800, `1.25rem`, tracking `-0.02em` |

Text is sentence case everywhere. No all-caps labels, no single accented word in headings.

### Shape

| Element | Radius |
|---|---|
| Buttons, inputs | `10px` |
| Result panel | `14px` |
| App icon in result | `12px` (52px icon) |
| App icon on "not available" page | `22px` (96px icon), close to Apple's icon mask |
| Signal slot | `0.2em` |

No shadows anywhere, except the input focus glow.

## Components

| Component | Markup / class | Notes |
|---|---|---|
| Top bar | `header.wrap.top` | Brand (links to `/`) left, "GitHub" right. Same on all pages. |
| Route demo | `.route` with `.from`, `.via#where`, `.to` containing `.slot#slot` | `.from` shows the real host via `homePage(host)`. Example app ID `1232780281`. `.via` draws a 2px vertical connector with `::before`. |
| Link maker | `form#maker.maker` | Label, then `.field` (input + "Get my link" button), hint, then `#out` for result or error. `novalidate`: validation is done in script so messages match the voice. |
| Result panel | `.result` inside `#out` | Appears immediately for a valid link or App ID, with the ID, labelled read-only link field (mono), "Copy link" (primary) and "Try it" (quiet, new tab). An optional lookup adds the app name and icon; unconfirmed information produces a neutral hint without removing the link. |
| Primary button | `.btn` | Route background, route-ink text, 700 weight. |
| Quiet button | `.btn.quiet` | Transparent, ink text, line border. |
| Steps | `ol.steps` | CSS counter in a 2.25rem ink-outlined circle. Numbered **because the content is a real sequence**; don't reuse the pattern for unordered content. Auto-fit grid, min column `15rem`. |
| Device table | `table.devices` | `th scope="row"` device, `td` behavior. Rules between rows only. |
| FAQ | `.faq details > summary` | Native disclosure. "+" / "−" drawn with `::after`; default marker hidden. |
| Message page | `.solo` | Top bar plus a vertically centered `.panel` (max `30rem`): optional icon, H1, paragraph, one button. |
| Site icon | `public/favicon.svg`, `public/apple-touch-icon.png` | The country slot: `--signal` square, corner radius 22% of its width, navy (`--signal-ink`) Overpass 800 "H" centered at 60% of the height, no border or shadow. The "H" is an outline path, so it doesn't depend on fonts. The 180×180 touch icon has square corners because iOS adds its own rounding. Linked from every page's head. |
| Link preview | `public/og.png`, `previewMeta()` | 1200×630 on `--paper`, 80px padding, left-aligned: the H1 at 72px on two lines, the route line `apps.apple.com/jp/app/id1232780281` in Overpass Mono 600 at 44px with "jp" on the slot, "Hither" at 32px bottom left. Rendered once and committed, never generated per request; re-render it if the headline or colors change. Home page only: `og:title`, `og:description`, `og:image` (absolute, from the request's origin) with width and height, `twitter:card` `summary_large_image`. |

## States and interactions

| Element | State | Behavior |
|---|---|---|
| Button | Hover | `filter: brightness(1.08)` |
| Button | Disabled (while checking) | Opacity 0.6, `cursor: progress`; label becomes "Checking the App Store" |
| Input | Focus | Border turns `--route` plus a 3px glow at 25% route |
| Any focusable | Keyboard focus | 3px `--route` outline, 3px offset (`:focus-visible`) |
| Link maker | Invalid input | Inline error, input refocused: "That isn't an App Store link. Paste a link that contains id followed by numbers, like id1232780281." |
| Link maker | App not found (404) | "Hither couldn't find this app in the App Store. Check the link and try again." |
| Link maker | Apple unreachable / other error | Server message, or "Hither couldn't reach the App Store. Try again in a minute." |
| Link maker | Success | Result panel replaces previous output; link field is filled with `origin + "/" + id` |
| Copy link | Click | Writes to clipboard (falls back to selecting the field and `execCommand("copy")`); label becomes "Copied" for 1.8s, then reverts |
| Try it | Click | Opens the Hither link in a new tab, so the visitor sees their own redirect |
| FAQ item | Click / Enter / Space | Opens or closes (native `<details>`); "+" becomes "−" |

Accepted input (same rules as `parseAppStoreLink` on the server): full `apps.apple.com` or `itunes.apple.com` links with or without a country, `id123456789`, or a bare 5 to 12 digit number. Pasting different countries' links for one app yields the same Hither link.

## Responsive behavior

The layout is fluid; type and spacing scale with `clamp()`. There is one breakpoint.

| Width | Changes |
|---|---|
| Above 34rem (544px) | Input and button share a row; device table is a two-column table; steps are 1 to 3 columns via auto-fit |
| 34rem and below | "Get my link" button goes full width under the input; device table stacks (device name above description); steps are one column |

The route "to" URL is sized so `apps.apple.com/xx/app/id` plus a 10-digit ID fits one line at 390px. `overflow-wrap: anywhere` prevents horizontal scroll if a host or ID is longer. Verified: no horizontal scroll at 390px or 1280px.

## Motion

| Element | Trigger | Animation | Duration | Easing |
|---|---|---|---|---|
| Hero country slot | Timer every 2200ms | Code and caption change; slot flips in with `rotateX(90deg → 0)` like a departure board | 420ms | `cubic-bezier(.3,.7,.3,1)` |

Order: Japan, Germany, Brazil, South Korea, France, India, United States, then repeat. Caption reads "A visitor in {country} goes to".

This is the **only** ambient motion on the site. Don't add entrance animations or hover motion to other elements; the flip is the memorable moment and works because nothing else moves.

With `prefers-reduced-motion: reduce`, the timer never starts: the hero stays on Japan.

## Accessibility

- **Focus order:** brand, GitHub, link input, Get my link, (after success) Copy link, Try it, FAQ summaries in order, footer link.
- **Labels:** input has a visible `<label for="app-url">`; result field has "Your Hither link" label; route demo has an `aria-label` describing the example.
- **Live regions:** `#out` is `aria-live="polite"`, so results and errors are announced; error paragraphs also have `role="alert"`. The rotating caption is `aria-live="off"` on purpose: announcing it every 2.2s would be noise.
- **Tables:** device names are `th scope="row"`.
- **Language:** `<html lang="en">`.
- **Images:** app icons are decorative (`alt=""`); the app name is always shown as text next to them.

## Edge cases

| Case | Behavior |
|---|---|
| Very long app name | Wraps naturally in the result panel and as the H1 on the "not available" page; never truncated |
| Apple returns no icon | Icon element is removed; layout doesn't leave a gap |
| Long country names | "Not available" copy uses `Intl.DisplayNames` (e.g. "United States", "South Korea"); button text wraps if needed |
| Long custom domain | Route "from" line wraps (`overflow-wrap: anywhere`) |
| Fonts fail to load | System fonts take over; layout holds because sizes are relative |
| Slow connection | Link and copy action appear immediately; a result hint says public App Store information is being checked |
| App not published or Apple lookup fails | Link remains available with the App ID and a neutral hint to check the ID; no claim that the app definitely does not exist |
| Another link is generated during a lookup | A late metadata response cannot overwrite the newer result |
| JavaScript disabled | Page reads fully; submitting the link maker just reloads the page. Acceptable for this audience |

## Known follow-ups

Not blocking, listed in rough priority order:

1. **Clipboard fallback** uses the deprecated `execCommand("copy")`. Fine for now; remove when dropping very old browsers.
2. **Custom domain:** once bought, the hero and the preview image URL automatically use it (they read the request's origin).

## Checklist for changes

- Keep values in the tokens; don't hard-code new colors.
- `--signal` stays exclusive to the country slot (hero, icon, preview image).
- Elements with `.wrap` set only vertical padding.
- Check 390px and 1280px, light and dark, for horizontal scroll.
- Re-run the contrast check for any color change.
- `npm test` and `npm run typecheck` pass.

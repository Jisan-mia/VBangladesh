# একটুখানি: technical SEO findings

Audited 2026-10-12 against the production build at `http://127.0.0.1:3200` (`next start`, `SITE_URL=https://ektukhani.example`, empty scratch `DATA_DIR`). Method: curl and node scripts, plus reading the code. I fetched all 337 sitemap URLs (4 hub pages, plus 111 tools × tool/guide/privacy), 14 edge-case URLs (trailing slash, uppercase, query string, `/favicon.ico`, the manifest, 404s) and one real `/s/<id>` page. To get that share page I created one test share through `POST /api/share` on the local server. It went into the scratch DB, not `data/`. Lighthouse is not installed, so Core Web Vitals were **not measured**. Performance below covers only payload, caching and loading hints.

Checklist source: the third-party `claude-seo` skill (seo-technical, seo-schema, seo-sitemap, seo-images, seo-hreflang, seo-audit). I used it as reference data only. None of its scripts were run.

## Scores (seo-audit weights)

| Category | Weight | Score | Basis |
|---|---|---|---|
| Technical SEO | 22% | **84** | Crawl, index, status and canonical checks all pass. The deductions are for thin or low-value URLs in the sitemap, uneven internal links, no security headers and a silent `SITE_URL` gate. |
| Schema / Structured Data | 10% | **78** | All JSON-LD parses and is valid schema.org. No Organization, no `alternateName` for the site name, one `applicationCategory` for all 111 tools, and the FAQPage markup brings no rich result. |
| Performance (CWV) | 10% | **74** (lab payload only; CWV not measured) | HTML is gzipped and small, and hashed assets are immutable. But `/public` assets get `max-age=0`, every page ships about 142 KB gz of JS (modern browsers), and the font preload is duplicated. |
| Images | 5% | **82** | Every OG image exists at 1200×630 with alt text. Two are over 300 KB. There is no apple-touch-icon, no manifest, no favicon.ico and no `og:image:width/height`. |
| Content, On-Page, AI readiness | 23 / 20 / 10% | not scored here | Out of scope for this file. |

Weighted subtotal for the 47% covered here: (84×22 + 78×10 + 74×10 + 82×5) / 47 = **80/100**.

---

## Findings

There are no **Critical** findings. Nothing blocks indexing with `SITE_URL` set, and every sitemap URL returns 200 with a self-canonical and `index, follow`.

### High

#### H1. A third of the sitemap is low-value per-tool privacy pages, and another third is thin guide pages
- **Evidence:** `GET /sitemap.xml` returns 337 URLs. 111 are `/<tool>/privacy` and 111 are `/<tool>/guide` (`app/sitemap.ts`). All return `index, follow` with a self-canonical. The visible main text of 15 sampled tools:
  - guide pages: 63–192 words (`/danguli/guide` 63, `/bostar-pahar/guide` 72, `/gpa/guide` 80);
  - privacy pages: 119–179 words. Each ends with the same boilerplate "সার্ভারে কী থাকে" paragraph;
  - tool pages: 316–1,652 words.

  The tool page already shows the first three guide steps in "যেভাবে করবে" (`shared/studio-page.tsx`). 13 of the 111 guides have exactly 3 steps, so apart from one intro sentence they repeat the tool page word for word. No one searches for "ক্যারম গোপনীয়তা".
- **Why it matters:** two of every three indexable URLs are thin pages that add little beside their tool page. Google spends crawl effort on them and judges the site as a whole on them. The real targets are the 111 tool pages.
- **Fix:**
  1. Per-tool privacy pages: in `app/[tool]/privacy/page.tsx` `generateMetadata`, return `{ ...pageMetadata(...), robots: { index: false, follow: true } }`, and remove `/${slug}/privacy` from `app/sitemap.ts`. Keep the pages: users need them and they are linked.
  2. Guide pages: either expand each one into real "how to play / how it's calculated" content (≥300 words, worked example, rules) and keep it indexed, or treat it like privacy (`noindex, follow`, out of the sitemap) until it is expanded. You can do this per tool with a flag in `SiteContent`. Leave `/privacy` and `/about` indexed.
- **Files:** `app/sitemap.ts`, `app/[tool]/privacy/page.tsx`, `app/[tool]/guide/page.tsx`, optionally `shared/site-types.ts`.

#### H2. Related-tool links always go to the same few tools, so many tools have only one real inbound link
- **Evidence:** BFS over the internal links of all 337 pages. Least-linked tools: `/namer-design`, `/desh-cheno`, `/bhori`, `/golir-ain`, `/matir-bank`, `/shesh-bol`, `/dhoyahin`, `/bagdhara` have **4** inbound links each. Those are `/tools` plus the tool's own guide, privacy and self links, so `/tools` is the only real one. `/kalbaishakhi-aam`, `/dudh-uthlano` and `/jhalmuri-sap` have **77** each. In `PageFrame` (`shared/site-shell.tsx`), `others.sort(sameCategory).slice(0, 3)` always picks the first three tools of each category in `lib/catalog.ts` order. The homepage links 46 of the 111 tools.
- **Why it matters:** every tool is still within 2 clicks (home → `/tools` → tool), so this is not a crawl-depth failure. But internal PageRank piles up on catalog order instead of being spread. Tools at the end of a category get almost no contextual links.
- **Fix:** choose the related tools deterministically but spread out. For example, take the 3 same-category neighbours *after* the current tool in catalog order (wrapping around), or rotate by a hash of the slug. Then every tool gets roughly the same number of related links.
- **Files:** `shared/site-shell.tsx` (`PageFrame`).

### Medium

#### M1. No security headers
- **Evidence:** `curl -I /alpana` returns no `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`/`frame-ancestors` or `Permissions-Policy`. `next.config.ts` has no `headers()`. (`poweredByHeader: false` is set, which is good.)
- **Why it matters:** headers carry little ranking weight, but HSTS stops first-visit HTTP downgrades. Framing protection matters because the site has share and download flows.
- **Fix:** add `async headers()` in `next.config.ts` with, on `/:path*`:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy: frame-ancestors 'self'`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`. Before adding this one, check that no tool uses the camera or geolocation.

  A full script CSP needs nonces because of Next's inline RSC scripts and the inline `location.replace` on `/s/[id]`, so leave that for later. HSTS can live at the CDN or host instead.
- **Files:** `next.config.ts`.

#### M2. Static assets in `/public` are served with `max-age=0`
- **Evidence:** `/fonts/bangla.woff2` (107,720 B), `/previews/adda.webp` and `/social/adda.png` all return `Cache-Control: public, max-age=0`. `/_next/static/*` correctly returns `max-age=31536000, immutable`.
- **Why it matters:** returning visitors on slow mobile connections have to revalidate the font, which is preloaded on every page, plus every thumbnail and OG image on every visit.
- **Fix:** in the same `headers()`, set `/fonts/:path*` to `public, max-age=31536000, immutable`. Set `/previews/:path*` and `/social/:path*` (unhashed names that change when a tool is redesigned) to `public, max-age=604800, stale-while-revalidate=86400`.
- **Files:** `next.config.ts`.

#### M3. `SITE_URL` must be set at **build** time, and if it is missing the result is a silent noindex
- **Evidence:** pages are prerendered (`x-nextjs-prerender: 1`). `.next/server/app/adda.html` has the robots meta baked in. `siteMetadata` sets `robots.index = Boolean(origin)`, and `app/robots.ts` returns `Disallow: /` without it. `metadataBase` then falls back to `http://127.0.0.1:3100`, so `og:image` would point at localhost. The README (line 63) documents this. Setting `SITE_URL` only at `next start` does not fix pages that were already built without it.
- **Why it matters:** failing closed is the right default. But one deploy built without the variable would quietly de-index the whole site and break every Facebook/WhatsApp preview, and nothing would fail.
- **Fix:** fail deploy builds loudly. For example, in `next.config.ts`: `if (process.env.DEPLOY === '1' && !process.env.SITE_URL) throw new Error('SITE_URL required for deploy builds')`, and set `DEPLOY=1` in the host's build step. After launch, run `npm run check:pages` against the live origin.
- **Files:** `next.config.ts` (or the deploy pipeline), `README.md`.

#### M4. Two OG images exceed the roughly 300 KB size WhatsApp reliably previews
- **Evidence:** all 112 `og:image` files return 200, PNG, 1200×630. The median is 170 KB, but `/social/cinema-poster.png` is 364,450 B and `/social/probash.png` is 356,727 B.
- **Why it matters:** sharing in chat apps is the main way people find the site. WhatsApp is widely reported to drop the large preview image above about 300 KB (an observed limit, not documented by Meta).
- **Fix:** re-export those two under 250 KB (quantized PNG or high-quality JPEG), and add a ≤300 KB check in the social-card generator.
- **Files:** `public/social/cinema-poster.png`, `public/social/probash.png`, and the generator under `scripts/`.

#### M5. Schema: no Organization node, and no `alternateName` for Google's site-name display
- **Evidence:** the homepage `@graph` is `WebSite + CollectionPage + FAQPage`. `WebSite` has `url: "https://ektukhani.example"` with no trailing slash, while BreadcrumbList uses `…/`. No page has an `Organization`, `publisher` or `logo`.
- **Why it matters:** Google picks the site name shown in results from `WebSite.name`/`alternateName` on the homepage. A Bangla-only name without a Latin `alternateName` gives Google no option for users who search in Latin script ("ektukhani"). Organization + `logo` is the supported way to suggest the logo shown in results.
- **Fix:** in `app/page.tsx`, give `WebSite` `@id: origin+"/#website"`, `url: origin+"/"`, `alternateName: "Ektukhani"` and `publisher: {"@id": origin+"/#org"}`. Add `Organization` with `@id: origin+"/#org"`, `name`, `alternateName`, `url` and `logo` (a raster image of at least 112×112; see L3). Do **not** add `SearchAction`: the sitelinks search box was retired in 2024.
- **Files:** `app/page.tsx`, optionally a shared `ORG_ID` in `shared/seo.ts`.

### Low

- **L1. Every tool, including 25 games, is typed `LifestyleApplication`.**
  - Evidence: `websiteSchema()` in `shared/seo.ts` hardcodes it.
  - Fix: map the catalog category to a type. Games: `['WebApplication','VideoGame']` plus `GameApplication`. "হিসাব-নিকাশ": `UtilitiesApplication`. "ভাষা আর পড়াশোনা": `EducationalApplication`. Others: `EntertainmentApplication`. Also add `@id`, `image` and `publisher`.
  - This is about accuracy only. Google requires `aggregateRating` or `review` for a rich result, so never invent ratings.
  - Files: `shared/seo.ts`, `lib/catalog.ts`.
- **L2. FAQPage on 112 pages.**
  - The markup is valid and matches the visible FAQ.
  - Since 2023 Google has shown FAQ rich results only for government and health sites. The skill says they were retired for everyone in May 2026; I couldn't verify that.
  - Keep it, but don't extend it. Don't add HowTo to guide pages: that rich result was removed in 2023.
- **L3. Missing app icons.**
  - Evidence: `/favicon.ico`, `/apple-icon.png` and `/manifest.webmanifest` return 404. The only icon is `/icon.svg`.
  - Fix: add `app/favicon.ico` (48px), `app/apple-icon.png` (180px), and `app/manifest.ts` (`lang: 'bn-BD'`, 192 and 512 PNG icons, `theme_color: '#1d2b53'`). Keep `icons` in `siteMetadata` consistent with these files.
  - Files: `app/*`, `shared/seo.ts`.
- **L4. Share pages are `noindex, nofollow` and also carry a self-canonical.**
  - Evidence: `/s/jDKXHGuJ`. The robots tag is in `<head>` for the curl, Googlebot, facebookexternalhit and Chrome user agents, and robots.txt does not block `/s/`, which is correct.
  - Fix: in `app/s/[id]/page.tsx`, use `robots: { index: false, follow: true }` and remove the canonical. A canonical on a noindex page sends mixed signals, and `nofollow` throws away any equity from links posted on the web.
- **L5. 404s.**
  - `/nope-404` has no `<title>`. `/s/doesnotexist` serves the bare `__next_error__` HTML shell: no `lang`, `<title>` or `<h1>`. The custom not-found text appears only in the RSC payload. This happens for every user agent tested, because `notFound()` is thrown inside `generateMetadata`.
  - Fix: add `export const metadata = { title: … }` to both `not-found.tsx` files. In `generateMetadata`, return plain noindex metadata when the row is missing, and call `notFound()` only in the page.
  - Files: `app/not-found.tsx`, `app/s/[id]/not-found.tsx`, `app/s/[id]/page.tsx`.
- **L6. Guide and privacy pages have no BreadcrumbList, and `PageFrame` sets `aria-current="page"` on the tool link even on guide and privacy pages.**
  - Fix: add a 3-level crumb (home → tool → guide) if the guides stay indexed.
  - Files: `shared/site-shell.tsx`, `app/[tool]/guide/page.tsx`.
- **L7. No `<lastmod>` in the sitemap.** Add it only if it is accurate, for example the git date of `tools/<slug>/`, never the build time. File: `app/sitemap.ts`.
- **L8. Font preloads.**
  - Evidence: every page has two `<link rel="preload" href="/fonts/bangla.woff2">` tags plus the same `Link:` header. The H1 font `display-bangla.woff2` (90 KB) is not preloaded.
  - Fix: keep a single preload. Once LCP can be measured, test whether preloading the display font helps the home hero.
  - File: `app/layout.tsx`.
- **L9. About 142 KB gzipped of JS on every page for modern browsers, even static ones.**
  - Evidence: 182 KB including the 39.6 KB `noModule` polyfills. Tool pages are 197–204 KB. This is the framework floor (Next runtime 67 KB, React 69 KB, react-dom 64 KB) under `next build --webpack`.
  - Fix: compare a default Turbopack build, check for client components that don't need to be, and measure field INP/LCP before doing more.
- **L10. Large inline SVG and RSC payloads.**
  - Evidence: `/alpana` HTML is 379 KB, 296 KB of it inline SVG (2,116 paths). `/tools` is 298 KB, `/pitha` 270 KB, `/` 237 KB. Gzipped they are only 27–36 KB, far below the 2 MB limit.
  - Fix (optional): an SVG sprite or `<img>` files for the alpana thumbnails.
- **L11. No `og:image:width` or `og:image:height`.** Add `width: 1200, height: 630` to the images in `siteMetadata` (`shared/seo.ts`).
- **L12. `lang` and hreflang need no change.**
  - `bn-BD` is valid and matches the content: Bangladeshi vocabulary, BDT, SSC/HSC.
  - A single-language site has no alternates, so hreflang has nothing to point to and a self-only tag adds nothing. Don't add it.
  - Google detects the language from the content, so diaspora users searching in Bangla are not excluded.
- **L13. IndexNow is not implemented.** It helps Bing and Yandex only; consider it after launch.

---

## What already works

- **Fail-closed indexing:** without a valid HTTPS `SITE_URL`, robots.txt returns `Disallow: /`, the sitemap is empty, pages are `noindex` and there are no canonicals. `publicOrigin()` rejects http, paths and credentials.
- **robots.txt** allows everything except `/api/`, doesn't block `/_next/`, lists the absolute sitemap, and doesn't block AI crawlers.
- **Sitemap:** valid XML, 337 URLs, all return 200, all match their canonicals, no redirects, no noindexed URLs.
- **Canonicals:** self-referencing absolute canonical plus matching `og:url` on all 337 pages. `/adda?x=1` canonicalizes to `/adda`.
- **Status codes and URLs:** a trailing slash gets a single 308 to the slash-less URL. `/ADDA` and unknown slugs return a real 404 with noindex (`dynamicParams=false`). No redirect chains. URLs are short, lowercase and transliterated.
- **Titles and descriptions:** 0 duplicate titles and 0 duplicate descriptions across 337 pages, exactly one `<h1>` per page, and all metadata in the SSR `<head>`. Tool content is server-rendered (316–1,652 words in the raw HTML).
- **Crawl depth:** every tool is ≤2 clicks from home, because `/tools` server-renders all 111 links. Every guide and privacy page is ≤3. Depth counts: 48 at depth 1, 156 at depth 2, 132 at depth 3, none unreachable.
- **Share pages** are noindex in `<head>` for every user agent tested, are not in the sitemap, and give chat apps a full OG/Twitter card.
- **JSON-LD** is in the initial HTML, `<`-escaped, valid on every page, uses absolute URLs, and matches visible content. No HowTo and no fake ratings.
- **OG/Twitter:** 112 distinct images, all 200, all 1200×630, `summary_large_image`, with alt text on every page type.
- **Images:** no `<img>` without `alt`. Thumbnails are decorative `alt=""` inside an `aria-hidden` card next to the visible name. Every thumbnail uses `next/image` with srcset (about 10 KB at 256w), lazy loading and async decoding.
- **Performance basics:** gzip on HTML (home 29.6 KB), `_next/static` immutable, fonts subset by `unicode-range` with `font-display: swap`, one 26 KB render-blocking CSS file, no third-party scripts or analytics.
- **Mobile:** correct viewport and `theme-color`, 48 px inputs, 16–17 px body text.

## Notes on the third-party skill
- I found no injection or exfiltration text in the files I read.
- Nearly every step runs `scripts/claude-seo run …py`, and many of these call paid APIs (DataForSEO, Google, Moz/Bing, Matomo). `seo-audit` also says "Always offer PDF generation". I ran none of them.
- `seo-technical` tells the operator to set `CLAUDE_SEO_LOCAL_TARGETS` so its scripts can reach localhost. I did not do it.
- Some date claims are stated as fact and I could not verify them: FAQ rich results "retired for ALL sites on May 7, 2026", back-button-hijacking enforcement "since 2026-06-15", AMP changes "since 2026-07-01". Check them against developers.google.com. This report does not depend on any of them.

---

Not checked: Core Web Vitals (no Lighthouse), HTTP→HTTPS and www→apex redirects (they depend on the host), and on-page/content quality beyond word counts. I added one test share row to the scratch DB at `scratchpad/seo-data`, not to the repo's `data/`.
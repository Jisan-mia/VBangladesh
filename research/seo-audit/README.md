# SEO audit (October 2026)

This audit used the checklists from the third-party `claude-seo` skill (AgriciDaniel, v2.4.2) as reference only. None of its scripts were run and nothing was installed. The skill was cloned, read and deleted afterwards. Three auditors checked a production build served with a placeholder domain. Their full findings are in this folder:

- `findings-technical.md`: crawl, index, schema, images and performance. Scored 80 for the 47% of the audit it covers.
- `findings-content.md`: titles, H1s, intent, thin pages, internal links and clusters. Scored 71.
- `findings-ai.md`: AI crawlers, llms.txt, citability and agent readiness. Scored 66.

## Fixed in this pass

- **Thin pages:** the 222 guide and per-tool privacy pages are now `noindex, follow` and out of the sitemap. The sitemap went from 337 URLs to 119: tools, category hubs and site pages.
- **Category hubs:** `/games`, `/quiz`, `/hishab` and `/utsob` each have a keyword H1, an intro, CollectionPage/ItemList schema and breadcrumbs. They are linked from `/tools`, the footer and each tool's breadcrumb.
- **Internal links:** "related tools" now rotates through same-category neighbours, so every tool gets inbound links.
- **Schema:**
  - Organization plus WebSite, with `@id`, the Latin `alternateName` "Ektukhani", and a logo.
  - The application type follows the category (games are `WebApplication` + `VideoGame`).
  - `publisher`, `image` and `alternateName` from the search keywords.
  - `dateModified` where a tool shows a real verification date.
  - The tool breadcrumb now includes its hub.
  - The about page is marked as an AboutPage.
- **robots.txt:** search and AI-answer crawlers are allowed. Training crawlers are allowed too, except on `/s/` share pages, which hold names people typed.
- **llms.txt:** added at `/llms.txt`, built from the catalog with English glosses and deep-link formats.
- **Headers:** security headers (HSTS, nosniff, Referrer-Policy, frame-ancestors, Permissions-Policy), long caching for fonts, and one-week caching for thumbnails and share images.
- **Missing domain fails loudly:** a deploy build without `SITE_URL` now stops with an error (set `DEPLOY=1` in the host's build step).
- **Icons and manifest:** favicon.ico, apple-icon, 192/512 icons and a web manifest. OG images now carry width and height. The two OG images over 300 KB were shrunk under 130 KB.
- **Share and 404 pages:** share pages are `noindex, follow` with no canonical. Missing share links and 404s now have a proper title.
- **Copy:**
  - 19 titles rewritten keyword-first, with "বাংলা গেম" padding removed.
  - 4 descriptions rewritten.
  - 38 H1s now start with the search term (a kicker inside the H1).
  - Search spellings people type added to FAQs, such as SSC, age calculator, ক্যারাম, সেহেরি, বিদ্যুত and ধাধা.
  - The about page is expanded: sourcing policy, who makes it and how, and how to report mistakes.
- **Accessibility:** 9 canvas games now announce the score in a live region. জমির মাপ also got a length × width helper.

## Not done, for later

- **Core Web Vitals** were not measured (no Lighthouse). Measure field data after launch.
- **JS weight:** about 142 KB gzipped per page is mostly the framework. The large inline SVG on `/alpana` is optional to slim down.
- **Owner's decision:** a contact address and the Facebook page for the about page and `Organization.sameAs`.
- **After launch:** set `SITE_URL` and `DEPLOY=1`, check robots.txt and the sitemap live, submit the sitemap to Search Console, and consider IndexNow (Bing/Yandex).
- **Verified dates:** the ISO verification dates sit next to the Bangla display dates in seven tools, so update both together.

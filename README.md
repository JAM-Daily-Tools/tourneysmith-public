# TourneySmith public website

Static marketing, invitation, privacy, Terms of Service, and account-deletion
pages for [tourneysmith.com](https://tourneysmith.com). Cloudflare Workers
Static Assets serves the repository root with no production build step.

## Locales and routes

| Locale | Route prefix | Pages |
|---|---|---|
| `en` | `/` | landing, privacy, terms, delete-account |
| `es` | `/es/` | landing, privacy, terms, delete-account |
| `es-ES` | `/es-ES/` | landing, privacy, terms, delete-account |
| `pt-BR` | `/pt/` | landing, privacy, terms, delete-account |
| `fr` | `/fr/` | landing, privacy, terms, delete-account |
| `it` | `/it/` | landing, privacy, terms, delete-account |

Every page has a visible language selector, localized canonical metadata, and
reciprocal `hreflang` links. Only landing and invitation views may use a saved
or browser language automatically. Legal pages never redirect by language.

## Source and generated files

The deployed HTML is committed. `tools/generate-site.mjs` generates the 24 HTML
pages and `sitemap.xml` from the localized content modules. Run it only when
editing site copy:

```bash
node tools/generate-site.mjs
```

`tools`, `docs`, and `test` are excluded from deployed assets by
`.assetsignore`. `styles.css` and `site.js` are shared by every locale.

## Invitation routing

The landing accepts `/invite/<token>`, `/?invite=<token>`, and localized
equivalents. `_redirects` rewrites path-based invitations to the matching
locale landing without changing the visible path or query. `site.js` preserves
the path token, query string, and fragment when the visitor changes language,
then opens `tourneysmith://invite/<token>` on request.

Store URLs remain placeholders. Set live store links only after the listings
are known. Do not change `app-ads.txt`, `.well-known/assetlinks.json`, or
`.well-known/apple-app-site-association` as part of localization. The Android
association covers the local release certificate and every Play signing path.
The Apple association identifies Team ID `25ADYD99Q3`, bundle ID
`com.jamdailytools.tourneysmith`, and only `/invite/*` URLs.

## Legal boundary and launch decision

The planned distribution includes the confirmed North American and Brazilian
markets plus the approved Spanish-speaking Latin American markets. Optional
neighboring markets remain candidates until the owner enables them. EEA and UK
storefronts are deferred. Apple’s standard EULA governs the iOS app license;
the website Terms govern TourneySmith accounts and hosted services. See
`docs/launch-compliance-decisions.md` for the exact market record and
`docs/native-review-checklists.md` for translation review status.

All legal text is prepared for qualified legal review. It must not be described
as a legal-compliance certification.

## Owner-run tests

The repository rules prohibit the assistant from running tests. The owner runs:

```bash
node --test test/landing-copy.test.mjs
```

Expected result: 17 passing tests.

## Deployment notes

`wrangler.jsonc` serves the repository root. A push to the connected deployment
branch can deploy automatically, so review generated HTML and owner-run test
results before pushing. `tourneysmith.com` must be attached as the Worker custom
domain when launch configuration is ready.

The Cloudflare origin and Apple's association CDN served the exact AASA file on
2026-09-28. The live Android association also matched the repository with the
release certificate and all three Play signing paths.

Before launch, replace store placeholders and confirm Associated Domains is
enabled for the Apple Bundle ID and present in the distribution signature. With
the first TestFlight build installed, tap an HTTPS invite from Notes or Messages
on a real iPhone. A borrowed compatible iPhone is sufficient; TestFlight does not
require registering its UDID.

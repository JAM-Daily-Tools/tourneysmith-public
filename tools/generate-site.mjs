import {mkdir, writeFile} from "node:fs/promises";
import {locales, localeOrder} from "./localized-content.mjs";

const root = new URL("../", import.meta.url);
const pageFiles = {
  landing: "index.html",
  privacy: "privacy.html",
  terms: "terms.html",
  deletion: "delete-account.html",
};

function pathFor(localeKey, page) {
  const locale = locales[localeKey];
  const name = pageFiles[page];
  return `${locale.prefix}${name}`;
}

function routeFor(localeKey, page) {
  const locale = locales[localeKey];
  const leaf = page === "landing" ? "" : page === "deletion" ? "delete-account" : page;
  return `https://tourneysmith.com/${locale.prefix}${leaf}`;
}

function localHref(locale, page, hash = "") {
  const leaf = page === "landing" ? "" : page === "deletion" ? "delete-account" : page;
  return `/${locale.prefix}${leaf}${hash}`;
}

function head(localeKey, page, title, description) {
  const canonical = routeFor(localeKey, page);
  const alternates = localeOrder.map((key) =>
    `  <link rel="alternate" hreflang="${key}" href="${routeFor(key, page)}">`,
  ).join("\n");
  return `<!DOCTYPE html>
<html lang="${locales[localeKey].lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonical}">
${alternates}
  <link rel="alternate" hreflang="x-default" href="${routeFor("en", page)}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="https://tourneysmith.com/og-image.png">
  <meta name="theme-color" content="#1f8a4c">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="stylesheet" href="/styles.css">
  <script src="/site.js" defer></script>
</head>`;
}

function languageSelector(locale) {
  const options = [
    ["en", "English"],
    ["es", "Español (Latinoamérica)"],
    ["es-ES", "Español (España)"],
    ["pt-BR", "Português (Brasil)"],
    ["fr", "Français"],
    ["it", "Italiano"],
  ].map(([value, label]) => `<option value="${value}"${value === locale.lang ? " selected" : ""}>${label}</option>`).join("");
  return `<label class="language-picker"><span>${locale.labels.language}</span><select data-language-select aria-label="${locale.labels.language}">${options}</select></label>`;
}

function header(localeKey, page) {
  const locale = locales[localeKey];
  return `<header class="site-header">
  <a class="brand" data-local-link href="${localHref(locale, "landing")}"><img class="brand-mark" src="/brand-mark.png" alt="" width="43" height="21">TourneySmith</a>
  <nav class="nav" aria-label="${locale.labels.primaryNavigation}">
    <a data-local-link href="${localHref(locale, "landing", "#features")}">${locale.labels.features}</a>
    <a data-local-link href="${localHref(locale, "privacy")}">${locale.labels.privacy}</a>
    <a data-local-link href="${localHref(locale, "terms")}">${locale.labels.terms}</a>
    ${languageSelector(locale)}
  </nav>
</header>`;
}

function footer(localeKey) {
  const locale = locales[localeKey];
  return `<footer class="site-footer">
  <div>© <span data-current-year></span> JAM Daily Tools LLC. ${locale.labels.tagline}</div>
  <nav aria-label="${locale.labels.footerNavigation}">
    <a data-local-link href="${localHref(locale, "landing")}">${locale.labels.home}</a>
    <a data-local-link href="${localHref(locale, "privacy")}">${locale.labels.privacy}</a>
    <a data-local-link href="${localHref(locale, "terms")}">${locale.labels.terms}</a>
    <a data-local-link href="${localHref(locale, "deletion")}">${locale.labels.deletion}</a>
    <a href="mailto:support@jamdailytools.com">${locale.labels.support}</a>
  </nav>
</footer>`;
}

function storeBadges(locale) {
  return `<div class="stores">
  <a class="store-badge" data-store="android" href="#" aria-disabled="true"><span class="label"><small>${locale.landing.comingSoon}</small>Google Play</span></a>
  <a class="store-badge" data-store="ios" href="#" aria-disabled="true"><span class="label"><small>${locale.landing.comingSoon}</small>App Store</span></a>
</div>`;
}

function landingPage(localeKey) {
  const locale = locales[localeKey];
  const cards = locale.landing.cards.map((card) => `<article class="card"><h3>${card.title}</h3><p>${card.body}</p></article>`).join("\n");
  return `${head(localeKey, "landing", locale.meta.landingTitle, locale.meta.landingDescription)}
<body data-locale="${locale.lang}" data-page="marketing">
${header(localeKey, "landing")}
<main class="wrap">
  <section id="invite" class="invite-panel hidden" aria-live="polite">
    <h1>${locale.invite.title}</h1>
    <p>${locale.invite.body}</p>
    <button id="open-app" class="btn-primary" type="button">${locale.invite.open}</button>
    <div class="invite-fallback"><p>${locale.invite.fallback}</p>${storeBadges(locale)}</div>
  </section>
  <section id="landing">
    <div class="hero">
      <p class="tagline">${locale.labels.tagline}</p>
      <h1>${locale.landing.heading}</h1>
      <p class="lede">${locale.landing.lede}</p>
      ${storeBadges(locale)}
      <div class="sports">${locale.landing.sports.map((sport) => `<span>${sport}</span>`).join(" · ")}</div>
    </div>
    <section id="features" class="feature-section" aria-labelledby="features-title">
      <div class="section-heading"><h2 id="features-title">${locale.landing.featuresTitle}</h2><p>${locale.landing.featuresIntro}</p></div>
      <div class="features">${cards}</div>
    </section>
  </section>
</main>
${footer(localeKey)}
</body>
</html>
`;
}

function legalPage(localeKey, page) {
  const locale = locales[localeKey];
  const content = locale[page];
  const version = page === "terms" ? "2026-09-16" : page === "privacy" ? "2026-10-05" : "2026-09-27";
  const sections = content.sections.map((section) => `<section data-section="${section.id}"><h2>${section.title}</h2>${section.body}</section>`).join("\n");
  return `${head(localeKey, page, content.metaTitle, content.metaDescription)}
<body data-locale="${locale.lang}" data-page="${page === "deletion" ? "delete-account" : page}">
${header(localeKey, page)}
<main class="wrap">
  <article class="legal" data-document-version="${version}">
    <h1>${content.title}</h1>
    <p class="updated">${content.updated}</p>
    ${sections}
  </article>
</main>
${footer(localeKey)}
</body>
</html>
`;
}

for (const localeKey of localeOrder) {
  const locale = locales[localeKey];
  if (locale.prefix) await mkdir(new URL(locale.prefix, root), {recursive: true});
  await writeFile(new URL(pathFor(localeKey, "landing"), root), landingPage(localeKey));
  await writeFile(new URL(pathFor(localeKey, "privacy"), root), legalPage(localeKey, "privacy"));
  await writeFile(new URL(pathFor(localeKey, "terms"), root), legalPage(localeKey, "terms"));
  await writeFile(new URL(pathFor(localeKey, "deletion"), root), legalPage(localeKey, "deletion"));
}

const sitemapUrls = localeOrder.flatMap((localeKey) => Object.keys(pageFiles).map((page) => `  <url><loc>${routeFor(localeKey, page)}</loc></url>`));
await writeFile(new URL("sitemap.xml", root), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.join("\n")}
</urlset>
`);

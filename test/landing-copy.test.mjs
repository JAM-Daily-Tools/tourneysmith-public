import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {access, readFile} from "node:fs/promises";
import {runInNewContext} from "node:vm";
import test from "node:test";

const root = new URL("../", import.meta.url);
const locales = {
  en: {prefix: "", lang: "en", title: "TourneySmith | Run racket-sport tournaments"},
  es: {prefix: "es/", lang: "es", title: "TourneySmith | Organiza torneos de deportes de raqueta"},
  "es-ES": {prefix: "es-ES/", lang: "es-ES", title: "TourneySmith | Organiza torneos de deportes de raqueta"},
  "pt-BR": {prefix: "pt/", lang: "pt-BR", title: "TourneySmith | Organize torneios de esportes de raquete"},
  fr: {prefix: "fr/", lang: "fr", title: "TourneySmith | Organisez vos tournois de sports de raquette"},
  it: {prefix: "it/", lang: "it", title: "TourneySmith | Organizza tornei di sport con racchetta"},
};
const pages = ["index.html", "privacy.html", "terms.html", "delete-account.html"];
const routeFor = (locale, page) => {
  const suffix = page === "index.html" ? "" : page.replace(/\.html$/, "");
  return `https://tourneysmith.com/${locales[locale].prefix}${suffix}`;
};
const fileFor = (locale, page) => new URL(`${locales[locale].prefix}${page}`, root);
const read = (path) => readFile(new URL(path, root), "utf8");

test("every locale has the complete public page set", async () => {
  for (const locale of Object.keys(locales)) {
    for (const page of pages) await access(fileFor(locale, page));
  }
});

test("each document declares the exact locale language", async () => {
  for (const [locale, config] of Object.entries(locales)) {
    for (const page of pages) {
      const html = await readFile(fileFor(locale, page), "utf8");
      assert.match(html, new RegExp(`<html lang="${config.lang}">`), `${locale}/${page}`);
    }
  }
});

test("canonical and reciprocal hreflang links cover every locale", async () => {
  for (const locale of Object.keys(locales)) {
    for (const page of pages) {
      const html = await readFile(fileFor(locale, page), "utf8");
      assert.ok(html.includes(`<link rel="canonical" href="${routeFor(locale, page)}">`));
      for (const alternate of Object.keys(locales)) {
        assert.ok(html.includes(`hreflang="${alternate}" href="${routeFor(alternate, page)}"`));
      }
      assert.ok(html.includes(`hreflang="x-default" href="${routeFor("en", page)}"`));
    }
  }
});

test("landing metadata is translated", async () => {
  for (const [locale, config] of Object.entries(locales)) {
    const html = await readFile(fileFor(locale, "index.html"), "utf8");
    assert.ok(html.includes(`<title>${config.title}</title>`), locale);
    assert.match(html, /<meta name="description" content="[^\"]{80,}">/);
    assert.ok(html.includes(`<meta property="og:title" content="${config.title}">`));
  }
});

test("navigation and footer links stay in the selected locale", async () => {
  for (const [locale, config] of Object.entries(locales)) {
    const expectedPrefix = `/${config.prefix}`;
    for (const page of pages) {
      const html = await readFile(fileFor(locale, page), "utf8");
      const links = [...html.matchAll(/data-local-link href="([^\"]+)"/g)].map((match) => match[1]);
      assert.ok(links.length >= 4, `${locale}/${page} has too few local links`);
      for (const link of links) assert.ok(link.startsWith(expectedPrefix), `${locale}: ${link}`);
    }
  }
});

test("translated pages do not leak common English interface copy", async () => {
  const forbidden = [
    "Home", "Features", "Privacy Policy", "Terms of Service", "Delete account",
    "Open in app", "Contact us", "All rights reserved", "Last updated",
  ];
  for (const locale of Object.keys(locales).filter((value) => value !== "en")) {
    for (const page of pages) {
      const html = await readFile(fileFor(locale, page), "utf8");
      for (const phrase of forbidden) assert.ok(!html.includes(`>${phrase}<`), `${locale}/${page}: ${phrase}`);
    }
  }
});

test("public copy contains no em dashes or prohibited filler", async () => {
  const prohibited = ["\u2014", "seamlessly", "game-changing", "revolutionary", "elevate your"];
  for (const locale of Object.keys(locales)) {
    for (const page of pages) {
      const html = (await readFile(fileFor(locale, page), "utf8")).toLowerCase();
      for (const phrase of prohibited) assert.ok(!html.includes(phrase), `${locale}/${page}: ${phrase}`);
    }
  }
});

test("legal translations share versions and section contracts", async () => {
  const contracts = {
    "privacy.html": {version: "2026-10-03", sections: ["scope", "controller", "collection", "purposes", "providers", "advertising", "sharing", "transfers", "retention", "choices", "rights", "children", "security", "united-states", "brazil", "mexico", "canada-quebec", "eea-uk", "changes", "contact"]},
    "terms.html": {version: "2026-09-16", sections: ["acceptance", "eligibility", "accounts", "service", "conduct", "user-content", "invitations", "billing", "advertising", "store-terms", "apple-license", "deletion", "suspension", "intellectual-property", "disclaimers", "liability", "governing-law", "regional-rights", "availability", "changes", "contact"]},
    "delete-account.html": {version: "2026-09-27", sections: ["before-delete", "in-app", "web-request", "immediate-effects", "retention", "subscriptions", "shared-records", "regional-rights", "help"]},
  };
  for (const [page, contract] of Object.entries(contracts)) {
    for (const locale of Object.keys(locales)) {
      const html = await readFile(fileFor(locale, page), "utf8");
      assert.ok(html.includes(`data-document-version="${contract.version}"`), `${locale}/${page}`);
      assert.deepEqual([...html.matchAll(/data-section="([^\"]+)"/g)].map((match) => match[1]), contract.sections);
    }
  }
});

test("only marketing and invite surfaces can auto-select a language", async () => {
  const siteJs = await read("site.js");
  const sandbox = {window: {}, URL};
  runInNewContext(siteJs, sandbox);
  const {shouldAutoLocalize} = sandbox.window.TourneySite;
  assert.equal(shouldAutoLocalize("marketing"), true);
  assert.equal(shouldAutoLocalize("invite"), true);
  for (const page of ["privacy", "terms", "delete-account"]) assert.equal(shouldAutoLocalize(page), false);
  for (const locale of Object.keys(locales)) {
    for (const page of pages.filter((value) => value !== "index.html")) {
      const html = await readFile(fileFor(locale, page), "utf8");
      assert.ok(!html.includes("data-page=\"marketing\""));
      assert.ok(!html.includes("data-page=\"invite\""));
    }
  }
});

test("localized invite routing preserves tokens, queries, and fragments", async () => {
  const siteJs = await read("site.js");
  const sandbox = {window: {}, URL};
  runInNewContext(siteJs, sandbox);
  const {localizedPageUrl} = sandbox.window.TourneySite;
  assert.equal(
    localizedPageUrl("https://tourneysmith.com/invite/A_b-9?utm_source=club&invite=A_b-9#open", "es-ES"),
    "/es-ES/invite/A_b-9?utm_source=club&invite=A_b-9#open",
  );
  assert.equal(
    localizedPageUrl("https://tourneysmith.com/?invite=token-7&campaign=fall", "pt-BR"),
    "/pt/?invite=token-7&campaign=fall",
  );
  const redirects = await read("_redirects");
  for (const prefix of ["", "es/", "es-ES/", "pt/", "fr/", "it/"]) {
    assert.match(redirects, new RegExp(`^/${prefix}invite/\\*\\s+/${prefix}\\s+200$`, "m"));
  }
});

test("landing copy matches shipped product behavior without purchase claims", async () => {
  const html = await read("index.html");
  for (const value of [
    "Padel", "tennis", "pickleball", "badminton", "squash", "racquetball", "table tennis",
    "single elimination", "double elimination", "round robin", "ladder", "King of the Court",
    "rotating partners", "consolation", "points rankings", "saved players", "placeholder players",
    "player groups", "co-organizers", "live brackets", "venues", "notifications", "Android", "iOS",
  ]) assert.ok(html.toLowerCase().includes(value.toLowerCase()), value);
  for (const claim of ["Buy Pro", "8 tournaments", "unlimited tournaments", "report abuse in the app"]) {
    assert.ok(!html.includes(claim), claim);
  }
});

test("account deletion pages offer partial data deletion without closing the account", async () => {
  const prompts = {
    en: "Want us to delete some of your data but keep your account?",
    es: "¿Quieres que eliminemos algunos de tus datos y conservemos tu cuenta?",
    "es-ES": "¿Quieres que eliminemos algunos de tus datos y conservemos tu cuenta?",
    "pt-BR": "Quer que excluamos alguns dos seus dados, mas mantenhamos sua conta?",
    fr: "Vous voulez que nous supprimions certaines de vos données tout en conservant votre compte ?",
    it: "Vuoi che eliminiamo alcuni dei tuoi dati ma manteniamo il tuo account?",
  };
  for (const [locale, prompt] of Object.entries(prompts)) {
    const html = await readFile(fileFor(locale, "delete-account.html"), "utf8");
    assert.ok(html.includes(prompt), locale);
    assert.match(html, /data-partial-deletion[\s\S]*mailto:privacy@jamdailytools\.com/);
  }
});

test("legal scope records launch regions and the standard Apple EULA decision", async () => {
  const privacy = await read("privacy.html");
  const terms = await read("terms.html");
  const publicLegal = `${privacy}${terms}`;
  for (const region of ["United States", "Brazil", "Mexico", "Canada", "Québec"]) {
    assert.ok(publicLegal.includes(region), region);
  }
  assert.ok(terms.includes("Apple’s Standard Licensed Application End User License Agreement"));
  assert.ok(terms.includes("not currently offered in the EEA or the United Kingdom"));
  assert.ok(!privacy.includes("we signed a separate Firebase data processing agreement"));
  for (const internalNote of [
    "require qualified Brazilian legal review before launch",
    "translations are preparatory",
    "support review and future expansion",
    "plans to appoint EEA and UK Article 27 representatives",
  ]) assert.ok(!publicLegal.includes(internalNote), internalNote);
});

test("verification assets remain unchanged and are not localized", async () => {
  const expected = new Map([
    ["app-ads.txt", "1c79e66b160cac101850929eadd5f0c02c1d8250f5f2e8c967e6a127aa26bf5c"],
    [".well-known/assetlinks.json", "1d1679a91bfd8a18a2f8183e320ebf6964bf930a079ce041a20991db04b30eee"],
  ]);
  for (const [path, digest] of expected) {
    const value = await readFile(new URL(path, root));
    assert.equal(createHash("sha256").update(value).digest("hex"), digest);
  }
  for (const locale of Object.values(locales).filter((value) => value.prefix)) {
    await assert.rejects(access(new URL(`${locale.prefix}app-ads.txt`, root)));
    await assert.rejects(access(new URL(`${locale.prefix}.well-known/assetlinks.json`, root)));
  }
});

test("Android association covers the local release and every Play signing path", async () => {
  const [statement] = JSON.parse(await read(".well-known/assetlinks.json"));
  assert.equal(statement.target.package_name, "com.jamdailytools.tourneysmith");
  assert.deepEqual(statement.target.sha256_cert_fingerprints, [
    "B7:94:EE:15:7E:0D:09:30:E7:ED:17:B4:10:51:7A:B4:18:78:45:47:AF:4F:11:01:32:22:78:91:55:01:9F:17",
    "EA:EA:F8:3E:F4:08:3B:E5:16:CA:2D:0F:24:AC:8D:17:72:B8:64:13:81:4A:31:A5:81:16:70:D4:93:FF:63:CB",
    "E1:35:8C:40:22:C4:8D:5D:08:24:FE:85:27:EF:E1:3A:D1:2D:6F:D2:3D:6E:75:C8:FB:0B:B1:C4:B9:FB:20:60",
    "E3:E9:05:0B:33:13:E0:0F:86:89:A8:E2:86:5E:80:AC:19:92:B0:4F:C7:52:EA:95:7B:E7:86:7C:BE:3C:0F:01",
  ]);
});

test("Apple association file verifies the production iOS app for invite paths only", async () => {
  const association = JSON.parse(await read(".well-known/apple-app-site-association"));
  assert.deepEqual(association, {
    applinks: {
      apps: [],
      details: [{
        appID: "25ADYD99Q3.com.jamdailytools.tourneysmith",
        components: [{"/": "/invite/*", comment: "Matches TourneySmith invitation URLs."}],
      }],
    },
  });
  const headers = await read("_headers");
  assert.match(headers, /^\/\.well-known\/apple-app-site-association\s+Content-Type: application\/json$/m);
  for (const locale of Object.values(locales).filter((value) => value.prefix)) {
    await assert.rejects(access(new URL(`${locale.prefix}.well-known/apple-app-site-association`, root)));
  }
});

test("local links resolve and maintenance documentation matches the locale structure", async () => {
  for (const locale of Object.keys(locales)) {
    for (const page of pages) {
      const html = await readFile(fileFor(locale, page), "utf8");
      const links = [...html.matchAll(/href="(\/[^\"?#]+)"/g)].map((match) => match[1]);
      for (const link of links) {
        if (["/styles.css", "/site.js", "/og-image.png", "/favicon.png", "/apple-touch-icon.png", "/brand-mark.png"].includes(link)) continue;
        const relative = link === "/" ? "index.html" : `${link.replace(/^\//, "").replace(/\/$/, "")}.html`;
        const directoryIndex = `${link.replace(/^\//, "").replace(/\/$/, "")}/index.html`;
        await assert.doesNotReject(async () => {
          try { await access(new URL(relative, root)); } catch { await access(new URL(directoryIndex, root)); }
        }, `${locale}/${page}: ${link}`);
      }
    }
  }
  const readme = await read("README.md");
  for (const value of ["en", "es", "es-ES", "pt-BR", "fr", "it", "/pt/"]) assert.ok(readme.includes(value));
  const checklist = await read("docs/native-review-checklists.md");
  assert.match(checklist, /French[\s\S]*Awaiting native review/);
  assert.match(checklist, /Italian[\s\S]*Awaiting native review/);
  const assetsIgnore = await read(".assetsignore");
  for (const path of ["test", "tools", "docs"]) assert.match(assetsIgnore, new RegExp(`^${path}$`, "m"));
});

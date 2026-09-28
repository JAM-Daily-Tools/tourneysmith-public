(function (global) {
  "use strict";

  var localePrefixes = {
    en: "",
    es: "es",
    "es-ES": "es-ES",
    "pt-BR": "pt",
    fr: "fr",
    it: "it",
  };

  function shouldAutoLocalize(pageType) {
    return pageType === "marketing" || pageType === "invite";
  }

  function localeFromLanguages(languages) {
    var values = Array.isArray(languages) ? languages : [];
    for (var index = 0; index < values.length; index += 1) {
      var language = String(values[index]).toLowerCase();
      if (language === "es-es" || language.startsWith("es-es-")) return "es-ES";
      if (language === "pt" || language.startsWith("pt-")) return "pt-BR";
      if (language === "es" || language.startsWith("es-")) return "es";
      if (language === "fr" || language.startsWith("fr-")) return "fr";
      if (language === "it" || language.startsWith("it-")) return "it";
      if (language === "en" || language.startsWith("en-")) return "en";
    }
    return "en";
  }

  function stripLocale(pathname) {
    return pathname.replace(/^\/(?:es-ES|es|pt|fr|it)(?=\/|$)/, "") || "/";
  }

  function localizedPageUrl(input, locale) {
    var parsed = new URL(input, "https://tourneysmith.com");
    var path = stripLocale(parsed.pathname);
    var prefix = localePrefixes[locale] || "";
    var localizedPath = prefix ? "/" + prefix + (path === "/" ? "/" : path) : path;
    return localizedPath + parsed.search + parsed.hash;
  }

  function inviteToken(locationValue) {
    var parsed = new URL(locationValue, "https://tourneysmith.com");
    var queryToken = parsed.searchParams.get("invite");
    if (queryToken && queryToken.trim()) return queryToken.trim();
    var match = stripLocale(parsed.pathname).match(/^\/invite\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  global.TourneySite = {
    inviteToken: inviteToken,
    localeFromLanguages: localeFromLanguages,
    localizedPageUrl: localizedPageUrl,
    shouldAutoLocalize: shouldAutoLocalize,
  };

  if (!global.document) return;

  var document = global.document;
  var body = document.body;
  var currentLocale = body.dataset.locale || "en";
  var pageType = body.dataset.page || "legal";
  var currentUrl = global.location.href;
  var token = inviteToken(currentUrl);

  document.querySelectorAll("[data-current-year]").forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });

  document.querySelectorAll("[data-language-select]").forEach(function (select) {
    select.value = currentLocale;
    select.addEventListener("change", function () {
      var locale = select.value;
      try { global.localStorage.setItem("tourneysmith-language", locale); } catch (_) {}
      global.location.assign(localizedPageUrl(global.location.href, locale));
    });
  });

  if (token) pageType = "invite";

  if (shouldAutoLocalize(pageType) && currentLocale === "en") {
    var selected;
    try { selected = global.localStorage.getItem("tourneysmith-language"); } catch (_) {}
    var preferred = localePrefixes[selected] !== undefined
      ? selected
      : localeFromLanguages(global.navigator.languages || [global.navigator.language]);
    if (preferred !== "en") {
      global.location.replace(localizedPageUrl(currentUrl, preferred));
      return;
    }
  }

  if (token) {
    body.dataset.page = "invite";
    var landing = document.getElementById("landing");
    var invite = document.getElementById("invite");
    if (landing) landing.classList.add("hidden");
    if (invite) invite.classList.remove("hidden");

    function launchInvite() {
      global.location.href = "tourneysmith://invite/" + encodeURIComponent(token);
    }

    var openButton = document.getElementById("open-app");
    if (openButton) openButton.addEventListener("click", launchInvite);
    launchInvite();
  }
})(typeof window === "undefined" ? this : window);

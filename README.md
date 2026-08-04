# Courtzee web (static site)

Static marketing landing + privacy page + invite router for
[courtzee.app](https://courtzee.app). Zero build step — plain HTML/CSS/JS.
Intended for **Cloudflare Pages**.

## Files

| File | Purpose |
|---|---|
| `index.html` | Landing page **and** invite router. With no token it shows the marketing page; with an invite token it tries to open the app, then falls back to the store. |
| `privacy.html` | Public privacy policy. **Canonical** — the app repo no longer keeps a copy. |
| `terms.html` | Terms of Service, which also serves as the app's EULA. Canonical. |
| `styles.css` | Shared styling. |
| `_redirects` | Cloudflare Pages rewrites: `/invite/<token>` → `index.html`. Clean URLs serve `/privacy` and `/terms` automatically. |
| `.well-known/assetlinks.json` | Android App Links verification (template — needs the real fingerprint). |

## Deploy to Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   connect this repo (or direct-upload the `web/` folder).
2. Build settings: **no build command**; **output directory** = `web`.
3. Add the custom domain **courtzee.app** (Pages → Custom domains). DNS is
   already on Cloudflare.

## Invite routing

The app currently registers the custom scheme `courtzee://invite/<token>`
(see `app/src/main/AndroidManifest.xml`). The landing page accepts:

- `https://courtzee.app/invite/<token>`
- `https://courtzee.app/?invite=<token>`

and forwards to `courtzee://invite/<token>`, falling back to the Play Store
after ~1.5s if nothing handles the scheme.

## TODO before launch

- [ ] **Store links** — `index.html` `CONFIG.playStoreUrl` / `appStoreUrl` are
      placeholders. Update once the Play listing is live and iOS ships.
- [ ] **App Links fingerprint** — replace
      `REPLACE_WITH_RELEASE_SIGNING_SHA256_FINGERPRINT` in
      `.well-known/assetlinks.json` with the release signing cert SHA-256
      (`keytool -list -v -keystore <release.keystore>` or the Play Console
      App Signing page). Only needed once the app adds an `autoVerify` HTTPS
      intent-filter for the `courtzee.app` host (the P7-7 follow-up); the
      custom-scheme fallback above works without it.
- [ ] **Switch share links to HTTPS** — when App Links are verified, change the
      app's `INVITE_DEEP_LINK_PREFIX` (currently `courtzee://invite/`) to
      `https://courtzee.app/invite/` so links are clickable everywhere.
- [ ] **iOS** — add `.well-known/apple-app-site-association` when the iOS app
      ships.
- [ ] Replace text store badges with the official Google Play / App Store
      badge assets (follow each store's brand guidelines).

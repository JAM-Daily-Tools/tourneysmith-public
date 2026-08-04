# Courtzee web (static site)

Static marketing landing, legal pages, and invite router for
[courtzee.app](https://courtzee.app). Zero build step — plain HTML/CSS/JS.
Deployed as a **Cloudflare Worker with static assets** (see `wrangler.jsonc`);
pushes to `master` deploy automatically.

## Files

| File | Purpose |
|---|---|
| `index.html` | Landing page **and** invite router. With no token it shows the marketing page; with an invite token it tries to open the app, then falls back to the store. |
| `privacy.html` | Public privacy policy. **Canonical** — the app repo no longer keeps a copy. |
| `terms.html` | Terms of Service, which also serves as the app's EULA. Canonical. |
| `styles.css` | Shared styling. |
| `_redirects` | Cloudflare Pages rewrites: `/invite/<token>` → `index.html`. Clean URLs serve `/privacy` and `/terms` automatically. |
| `.well-known/assetlinks.json` | Android App Links verification. Contains two real SHA-256 fingerprints — see the TODO below; the release and Play-managed certs are **not** confirmed present. |
| `wrangler.jsonc` | Cloudflare Worker config. `assets.directory` is `.` — the site is served from the repo root, not a subfolder. |

## Deploy

The Cloudflare project is connected to this repo, so **pushing to `master`
deploys**. There is no build step and no output subdirectory — `wrangler.jsonc`
serves the repo root (`assets.directory: "."`).

The custom domain **courtzee.app** is already attached and DNS is on Cloudflare.

After any change, verify the deployed URL rather than the local file — a file in
this repo is not evidence that the page is live.

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
- [ ] **App Links fingerprints** — `.well-known/assetlinks.json` currently lists
      two SHA-256 fingerprints. They match entries registered in Firebase, but
      **which of them is the release signing cert has not been verified** (the
      release keystore lives on the Ubuntu machine). Confirm the release cert is
      present, and add the **Play App Signing** cert SHA-256 once the Play
      account exists — Play re-signs the bundle, so links break without it.
      Only required once the app adds an `autoVerify` HTTPS intent-filter for
      the `courtzee.app` host; the custom-scheme fallback above works without
      it.
- [ ] **Switch share links to HTTPS** — when App Links are verified, change the
      app's `INVITE_DEEP_LINK_PREFIX` (currently `courtzee://invite/`) to
      `https://courtzee.app/invite/` so links are clickable everywhere.
- [ ] **iOS** — add `.well-known/apple-app-site-association` when the iOS app
      ships.
- [ ] Replace text store badges with the official Google Play / App Store
      badge assets (follow each store's brand guidelines).

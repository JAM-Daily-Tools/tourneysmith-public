# TourneySmith web (static site)

Static marketing landing, legal pages, and invite router for
[tourneysmith.com](https://tourneysmith.com). Zero build step — plain HTML/CSS/JS.
Deployed as a **Cloudflare Worker with static assets** (see `wrangler.jsonc`);
pushes to `master` deploy automatically.

## Files

| File | Purpose |
|---|---|
| `index.html` | Landing page **and** invite router. With no token it shows the marketing page; with an invite token it tries to open the app, then falls back to the store. |
| `privacy.html` | Public privacy policy. **Canonical** — the app repo no longer keeps a copy. |
| `terms.html` | Terms of Service, which also serves as the app's EULA. Canonical. |
| `app-ads.txt` | AdMob authorized-sellers declaration. Must stay at the **root** and be served as `text/plain`. The publisher ID is public by design. AdMob only crawls this once a store listing declares `tourneysmith.com` as the developer website — see P14-7 in the app repo's `docs/tasks/CLOUD-PHASE-14.md`. |
| `styles.css` | Shared styling. |
| `_redirects` | Cloudflare Pages rewrites: `/invite/<token>` → `index.html`. Clean URLs serve `/privacy` and `/terms` automatically. |
| `.well-known/assetlinks.json` | Android App Links verification. Lists the **upload key** and the **Play App Signing** certs, so both directly installed and Play-installed builds verify. Confirmed 2026-09-08. |
| `wrangler.jsonc` | Cloudflare Worker config. `assets.directory` is `.` — the site is served from the repo root, not a subfolder. |

## Deploy

The Cloudflare project is connected to this repo, so **pushing to `master`
deploys**. There is no build step and no output subdirectory — `wrangler.jsonc`
serves the repo root (`assets.directory: "."`).

**Domain status (2026-08-10):** `courtzee.app` is still the attached custom domain and DNS is on
Cloudflare. `tourneysmith.com` is acquired but **not yet bound** to this Worker — do that only after
the deployed content reads TourneySmith, per R4 of the rebrand blocker. `tourneysmith.app` becomes a
path-and-query-preserving 301 to `tourneysmith.com`, and `courtzee.app` becomes a redirect once
TourneySmith is live.

After any change, verify the deployed URL rather than the local file — a file in
this repo is not evidence that the page is live.

## Invite routing

The app currently registers the custom scheme `tourneysmith://invite/<token>`
(see `app/src/main/AndroidManifest.xml`). The landing page accepts:

- `https://tourneysmith.com/invite/<token>`
- `https://tourneysmith.com/?invite=<token>`

and forwards to `tourneysmith://invite/<token>`, falling back to the Play Store
after ~1.5s if nothing handles the scheme.

## TODO before launch

- [ ] **Store links** — `index.html` `CONFIG.playStoreUrl` / `appStoreUrl` are
      placeholders. Update once the Play listing is live and iOS ships.
- [x] **App Links fingerprints** — done 2026-09-08. The file had drifted to a
      single fingerprint despite this note claiming two. `keytool` against the
      release keystore confirmed the one present was the **upload key**
      (`EA:EA:F8:3E…`), answering "which of them is the release cert". The
      **Play App Signing** cert (`B7:94:EE:15…`) was then added — Play re-signs
      the bundle, so without it links resolve in locally installed builds and
      break for every install from Play. Both are listed; neither replaces the
      other. Read from Play Console → Protected with Play → Manage Play app
      signing → **Classical key** (the post-quantum key alongside it has no
      documented Digital Asset Links path).
- [ ] **Switch share links to HTTPS** — when App Links are verified, change the
      app's `INVITE_DEEP_LINK_PREFIX` (currently `tourneysmith://invite/`) to
      `https://tourneysmith.com/invite/` so links are clickable everywhere.
- [ ] **iOS** — add `.well-known/apple-app-site-association` when the iOS app
      ships.
- [ ] Replace text store badges with the official Google Play / App Store
      badge assets (follow each store's brand guidelines).

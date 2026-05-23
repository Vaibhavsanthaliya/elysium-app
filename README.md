# Elysium

Elysium is a quiet ritual operating system: a small personal PWA for keeping daily domains without turning them into scores, dashboards, or performance theater.

It began as a skincare tracker, but that is no longer the product identity. Care remains one domain inside the system. The wider app is organized around Temple, Care, Chronicle, Light, Sleep, Mind, Stars, and the Workshop.

## What Elysium Is Not

- Not a skincare tracker.
- Not a productivity dashboard.
- Not a wellness SaaS.
- Not a habit-streak machine.
- Not a scorecard for self-optimization.

## Product Shape

Elysium treats each domain as its own mode of attention:

- **Temple** - the quiet entry surface and daily state.
- **Care** - the three-night care cycle and its practical protocol.
- **Chronicle** - a reading-first memory surface that occasionally accepts a line.
- **Light** - a witness surface for daylight and time of day.
- **Sleep** - a closure ritual that lets the app go quiet.
- **Mind** - a held session, not a productivity timer.
- **Stars** - a restrained constellation of kept days and seasons.
- **Workshop** - account, cues, install, import/export, and reset machinery.

Care can mention skin because skin is one domain. The repository should not describe the whole app as skincare software.

## Architecture

- Vanilla JavaScript PWA.
- No framework, bundler, or build step.
- Modular CSS under `css/`, loaded in the documented cascade order.
- Modular JavaScript under `js/`, with `main.js` as the entry point.
- Static deployment target, currently Vercel.
- Supabase sync for signed-in users.
- Local-first state stored in `localStorage`.
- Weekly photo binaries stored in IndexedDB.
- Service worker shell for offline loading and installability.

## Data Model Notes

The app intentionally keeps legacy storage names for compatibility.

- `localStorage` key: `skincare_app_v1`
- IndexedDB database: `skin-photos-v1`
- Supabase table: `user_data`

Do not rename these without an explicit migration plan. Identity copy can evolve without changing stored user data.

## Repository Layout

```text
elysium-app/
|-- index.html
|-- main.js
|-- manifest.json
|-- sw.js
|-- vercel.json
|-- css/
|   |-- base.css
|   |-- layout.css
|   |-- settings.css
|   |-- modal.css
|   |-- components.css
|   |-- cycle.css
|   |-- chronicle.css
|   |-- progress.css
|   |-- today.css
|   |-- auth.css
|   `-- temple.css
|-- js/
|   |-- constants.js
|   |-- utils.js
|   |-- state.js
|   |-- sync.js
|   |-- domains/
|   |-- services/
|   |-- render/
|   `-- ui/
|-- docs/
|   `-- ticket-log.md
|-- design/
|   `-- obsidian-temple/
|-- icon-192.png
|-- icon-512.png
`-- icon-maskable.png
```

## Local Development

Because the app is static, any simple local web server works:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Deployment

Deploy the repository as a static site. On Vercel, use the default settings:

- Framework preset: Other
- Build command: none
- Output directory: project root

The app shell, manifest, icons, CSS, and JavaScript are served as static files. Supabase is loaded client-side and used only for signed-in sync.

## PWA Install

After deployment over HTTPS:

- iPhone / iPad: Safari -> Share -> Add to Home Screen.
- Mac Safari: File -> Add to Dock.
- Chrome / Edge / Brave: use the browser install icon.

The service worker caches the app shell so Elysium can reopen offline after the first successful load.

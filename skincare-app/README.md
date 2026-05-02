# Skin · Skincare Routine Tracker

A minimal, Apple-styled skincare tracker. Static PWA — no backend, no database, no build step. Deploy to Vercel in under 2 minutes and access from any device.

## Features
- Editable tasks for morning, night, and habits
- 3-day night cycle (Niacinamide → Salicylic → Rest), each with its own task list
- Daily reminders (local notifications, configurable times)
- Streak tracking, 6-week calendar, milestone tracker
- Auto light/dark mode, full Apple aesthetic, safe-area handling
- Works offline once loaded, installable as a real app on iPhone/iPad/Mac/PC
- Data export/import as JSON
- All data stored locally in your browser — nothing leaves your device

---

## Deploy to Vercel

### Easiest path — GitHub + Vercel (recommended)

This way you push updates by editing files and `git push`, and Vercel redeploys automatically.

**1. Put it on GitHub**

In Terminal, from the unzipped folder:
```bash
cd skincare-app
git init
git add .
git commit -m "Initial skin tracker"
```

Go to [github.com/new](https://github.com/new), create a new private repo called `skincare-app`. Then back in Terminal:
```bash
git remote add origin https://github.com/YOUR-USERNAME/skincare-app.git
git branch -M main
git push -u origin main
```

**2. Connect to Vercel**

1. Go to [vercel.com](https://vercel.com) → sign up with your GitHub account (free)
2. Click **Add New → Project**
3. Pick the `skincare-app` repo → click **Import**
4. Leave all settings as-is (it auto-detects: framework = Other, root = ./, no build needed)
5. Click **Deploy**

Done. In ~30 seconds you'll get a URL like `skincare-app-yourname.vercel.app`. That URL is your app, served over HTTPS, accessible anywhere.

### Faster path — Vercel CLI (no GitHub needed)

If you'd rather skip GitHub:
```bash
npm install -g vercel
cd skincare-app
vercel
```

Follow the prompts (login with email, accept defaults). It deploys to a temporary URL. Run `vercel --prod` to deploy to the permanent production URL.

### Custom domain (optional)

In your Vercel project settings → **Domains** → add your own. Vercel handles HTTPS automatically.

---

## Installing as an app (after deploying)

Once deployed, open your Vercel URL on the device:

### iPhone / iPad (Safari)
1. Open the URL
2. Tap **Share** → **Add to Home Screen**
3. Tap **Add**
4. Open it from your Home Screen → looks and feels native

### Mac (Safari 17+)
1. Open the URL in Safari
2. **File → Add to Dock**
3. Becomes a windowed Mac app with its own Dock icon

### Mac / Windows (Chrome/Edge/Brave)
1. Open the URL
2. Click the install icon in the URL bar (computer with arrow)
3. Click **Install**

---

## Using it

**Today tab** — circular ring shows daily progress. Tap a task to check it off, tap the pencil to edit, tap **＋** to add. Day completes (streak +1) when all morning + night tasks are done.

**Cycle tab** — three cards for the night rotation. Tap one to make it tonight's routine; today's tab updates automatically. Each cycle day has its own editable task list — edit a night task and pick which cycle day(s) it belongs to.

**Progress tab** — streak, total days logged, this week (vs 7), 21-day goal, 6-week calendar (green = day complete), milestones tied to your start date.

**Settings tab** — set reminder times, toggle notifications, export/import data, reset start date.

---

## Notifications — what to know

- **iOS 16.4+:** notifications work *only* after you install to Home Screen. Then enable in Settings tab. Apple's restriction.
- **Mac/Desktop:** works in any modern browser. Permission prompts on first toggle.
- **Background reminders:** because there's no backend, reminders schedule via JS timers — they fire reliably while the app is open or has been opened recently. For true OS-level lock-screen reminders that fire when the app's never been opened that day, you'd need push notifications via a server (out of scope for a personal tool).

In practice: install to Home Screen → open it once a day → reminders work fine.

---

## File structure
```
skincare-app/
├── index.html       # Main app
├── styles.css       # Apple-style theming (light + dark)
├── app.js           # State, render, reminders, edit modal
├── sw.js            # Service worker (offline + install)
├── manifest.json    # PWA manifest
├── vercel.json      # Vercel headers config
├── icon-192.png     # App icons
├── icon-512.png
├── icon-maskable.png
├── .gitignore
└── README.md
```

No build step. No dependencies. Pure HTML/CSS/JS. Vercel just serves the files.

---

## Local dev (optional)

If you want to test changes before pushing:
```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Edit any file → reload browser → see changes. When happy, `git push` and Vercel redeploys.

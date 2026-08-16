# Work Sheet

A personal daily-routine app for Android — **not** published on the Play Store,
built for sideloading only (installed directly from an APK file).

## Features
- **Dashboard** — live clock, today's date, quick-add task box, mini calendar
- **Pending Works** — list of open tasks, mark complete, add remarks, delete
- **Completed Works** — history of finished tasks (can be undone)
- **Reminders** — title + date + time + remarks, fires a notification when due
- **Calendar** — full month view; tap any date to see tasks logged that day
- **Remarks** — every task/reminder has a free-text remarks field

All data is stored locally on the device (`localStorage`) — nothing is sent
anywhere, no internet permission is required to use the app.

---

## How the APK gets built (no local Android Studio needed)

This repo includes a GitHub Actions workflow
(`.github/workflows/build-apk.yml`) that automatically compiles the app into
an installable **debug APK** every time you push to GitHub. GitHub's own
servers do the compiling — you don't need Android Studio or the Android SDK
on your own machine.

### One-time setup

1. Create a new **GitHub repository** (public or private, either works).
2. Upload every file in this folder to that repository, keeping the folder
   structure exactly as-is (the `.github/workflows/build-apk.yml` file must
   stay at that exact path).
   - Easiest way: on the repo page, click **Add file → Upload files**, drag
     the whole project folder in, and commit to the `main` branch.
   - Or, with git installed:
     ```
     git init
     git add .
     git commit -m "Initial commit - Work Sheet app"
     git branch -M main
     git remote add origin https://github.com/<your-username>/<your-repo>.git
     git push -u origin main
     ```

### Getting the APK

3. Once pushed, go to the **Actions** tab of your GitHub repo.
4. You'll see a workflow run called **"Build Work Sheet APK"** — wait for the
   green checkmark (takes a few minutes the first time).
5. Click into that run, scroll to **Artifacts**, and download
   **`worksheet-debug-apk`**. Unzip it — you'll find `app-debug.apk` inside.
6. Transfer that `.apk` file to your Android phone (email, Google Drive,
   USB cable, WhatsApp to yourself — any method works).
7. On the phone, tap the file to install it. Android will warn that this is
   from an "unknown source" — this is expected and normal for apps not from
   the Play Store. Tap **Install anyway** (you may need to enable
   "Install unknown apps" for whichever app you used to open the file, in
   **Settings → Apps → Special access**).

That's it — the app opens as **Work Sheet** on your home screen.

### Optional: trigger a build manually / rebuild after changes
- Go to **Actions → Build Work Sheet APK → Run workflow** to trigger a build
  any time without needing a new push.
- Any time you edit files under `www/` and push again, a fresh APK is built
  automatically.

### Optional: attach the APK to a proper GitHub Release
If you'd rather have a permanent download link instead of digging through
Actions artifacts each time, push a version tag:
```
git tag v1.0.0
git push origin v1.0.0
```
The workflow will then also attach the APK to a **Release** on the repo's
"Releases" page, which is easier to share/download from long-term.

---

## Project structure
```
worksheet-app/
├── config.xml                  Cordova app configuration (name, id, icons)
├── package.json                Build dependencies (Cordova + Android platform)
├── www/                        The actual app (HTML/CSS/JS)
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js               App logic (tasks, reminders, calendar, clock)
│   ├── js/storage.js           Local storage data layer
│   └── icons/icon.png          App icon
└── .github/workflows/
    └── build-apk.yml           GitHub Actions: compiles the APK automatically
```

## Notes
- This produces a **debug** (unsigned) APK, which is perfectly fine for
  installing on your own device. It is not meant for, and cannot be
  submitted to, the Play Store in this form.
- Reminders fire while the app is open/running in the background; for a
  personal single-device tool this covers normal use. If you later want
  reminders to fire reliably even when the app is fully closed, the
  `cordova-plugin-local-notification` plugin is already declared in
  `package.json` and can be wired up for OS-level scheduled notifications.
- Want to change the app name, package id, or icon? Edit `config.xml`
  (the `<name>`, `id="..."` attribute, and `<icon>` tags) before pushing.

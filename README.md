# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@1.3.0 create --template minimal --types ts --add prettier eslint vitest="usages:unit" tailwindcss="plugins:none" sveltekit-adapter="adapter:auto" --install npm .
```

## Adding features

Add features to your project with `sv add`:

```sh
npx sv add
```

For example, to add Tailwind CSS:

```sh
npx sv add tailwindcss
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## PWA (Progressive Web App)

This project is configured as a PWA using [`vite-plugin-pwa`](https://github.com/antfu/vite-plugin-pwa). The plugin auto-generates the service worker and injects registration into the built app.

### Installable

- **Manifest**: `static/manifest.webmanifest`
- **Icons**: `static/pwa-192x192.png`, `static/pwa-512x512.png`
- **Service worker**: auto-generated at build time into `build/` (served at `/sw.js`)

### Regenerate icons

If you update the source icon (`static/icon-192.svg`), regenerate the PNGs:

```sh
npm run icons
```

### Build & serve

```sh
npm run build
npm run preview
```

Browsers will show an install prompt when the PWA criteria are met (HTTPS, valid manifest, service worker registered).

### Maintenance after every project update

After each code change that affects the PWA surface, follow this checklist:

1. **Rebuild** — regenerate the service worker and manifest:
   ```sh
   npm run build
   ```

2. **Verify the SW** — confirm the new service worker is registered and active:
   ```sh
   # Open the built app in a browser and check Application > Service Workers
   ```

3. **Clear old SWs** — if you changed caching logic or `workbox` config, unregister stale workers in the browser dev tools to force the new one to activate.

4. **Re-validate manifest** — run the PWA audit in Chrome Dev Tools (Lighthouse → "Progressive Web App" section) to ensure icons, theme colors, and `display` mode are correct.

5. **Update icons only when the logo changes** — if you redesign the logo, edit `static/icon-192.svg` and run `npm run icons`, then commit the new PNGs.

6. **Check `vite-plugin-pwa` version** — keep it current for security and Workbox updates:
   ```sh
   npm outdated | grep vite-plugin-pwa
   ```

### Configuration

PWA settings live in `vite.config.ts` under `VitePWA({...})`. Key fields:

- `registerType: 'autoUpdate'` — SW auto-updates when the built JS changes.
- `manifest` — PWA metadata (name, icons, theme colors, display mode).
- `workbox` — caching rules (`globPatterns`, `maximumFileSizeToCacheInBytes`).

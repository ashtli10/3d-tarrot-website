# 3D Tarot Viewer (PWA)

Interactive mobile‑first 3D viewer for `model.glb` with pan / orbit / pinch‑zoom using the [`<model-viewer>`](https://modelviewer.dev/) web component. Ships as a Progressive Web App: installable, offline capable, deployable as a static site (e.g. Vercel) with zero backend.

## Features

- Smooth touch gestures (pinch to zoom, one‑finger orbit, two‑finger pan) & mouse support
- Mobile performance tweaks (adaptive pixel ratio cap, low power when tab hidden)
- Loading progress bar with percent
- Reset + fullscreen controls (double‑tap model to reset; triple‑tap footer toggles FPS meter)
- Offline caching via Service Worker (network‑first for model so updates deploy cleanly)
- Installable PWA (manifest + icons included)

## Project Structure

```
index.html              Main page
model.glb               Your 3D asset (glTF binary)
manifest.webmanifest    PWA manifest
sw.js                   Service worker (caching strategy)
scripts/app.js          Viewer enhancements
scripts/register-sw.js  SW registration
icons/                  PWA icons & favicon assets
```

## Local Development

Any static server works. Example (Python 3):

```
python -m http.server 8000
```

Then open http://localhost:8000

## Deploy on Vercel

1. Commit & push this repository to GitHub.
2. Create a new Vercel project and import the repo.
3. Framework preset: “Other”. Build command: (leave empty). Output directory: `.` (root).
4. Deploy. Vercel serves static files automatically.

Updates to `model.glb` will be picked up (network‑first strategy). If users already opened the PWA they may need a refresh for new model + SW version; you can bump the `VERSION` constant in `sw.js` when you want to force cache invalidation.

## Performance Tips / Next Steps

- Optimize `model.glb`: Draco / Meshopt compression, remove unused nodes, bake lighting.
- Add an environment map (HDR) for better lighting (model-viewer `environment-image`).
- If model is very large, consider lazy loading or showing a lighter LOD first.
- For telemetry, add analytics that respects user privacy (e.g., simple count, no tracking).

## Customization

Edit camera starting position via `camera-orbit` attribute in `index.html`. Field of view via `field-of-view`. See model-viewer docs for more props (hotspots, AR, skybox, tone mapping, etc.).

## License

You own your model & icons. Code here is MIT (feel free to adapt).

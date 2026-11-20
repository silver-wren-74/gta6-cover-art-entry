[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/silver-wren-74/gta6-cover-art-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/silver-wren-74/gta6-cover-art-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Neon Coast Studio — GTA-style cover art maker

An offline web app that turns your own photos and a caption into multi-panel
cover art in the GTA poster style — angled panels, bold poster lettering and a
Vice City sunset / neon colour grade — and exports it as a shareable PNG.
Everything runs in the browser from static files: no uploads, no server, no
watermark, no network requests. All artwork and lettering are original and
drawn with canvas shapes and system font stacks; no game logos, artwork or
font files are used.

## What it does

- **Six layouts** — Hero, angled Duo split, Trio (hero + two beats), four-panel
  Grid, the six-panel Cover Grid with a title block, and tilted Snapshots.
- **Any photo, any panel** — add photos by file picker or drag-and-drop, assign
  any photo to any panel (or spread one photo across every panel), then frame
  each panel independently: drag the preview to pan, scroll to zoom, or use
  the pan/zoom sliders.
- **Five colour grades** — Vice Sunset, Neon Nights, Golden Hour, Midnight
  Teal and Clean, each a canvas filter + gradient wash over a matching sky
  backdrop, with film grain, vignette and a poster frame.
- **Poster caption** — editable headline and subtitle with four lettering
  styles (sunset gradient, poster white, neon pink, gold foil), heavy
  condensed lettering with ink outline and drop shadow, auto-fitted to width.
- **One-click PNG export** at the common post sizes: 1080×1080, 1080×1350,
  1920×1080 and 1080×1920 (story). Exports render at full resolution from the
  same canvas pipeline as the live preview.
- **Instant demo** — two original sample photos ship in `app/samples/`, so the
  studio opens with a finished cover already composed.

## Run it

Serve `app/` with any static file server and open it in desktop Chrome, e.g.:

```sh
cd app && python3 -m http.server 8080
# open http://localhost:8080
```

Screenshot scenes are reproducible through URL queries, as listed in
`shots.json`, e.g. `index.html?shot=cover&photos=boulevard,neon&layout=cover6&grade=sunset&size=wide`
renders a finished cover full-screen, and `?shot=editor` shows the editor
with that scene loaded.

## Hand in (make.fun entrypoint)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to the output directory and writes `dossier.json` with the vendored
`vendor/makefun-app.ts` library, under the competition's caps.

## Layout of this repo

- `app/index.html`, `app/style.css` — the page and editor styling
- `app/src/render.js` — the cover engine: panel geometry, grades, lettering
- `app/src/main.js` — editor wiring: loading, framing, live preview, export
- `app/src/shots.js` — the `?shot=` screenshot scenes
- `app/samples/` — two original sample photos made for this app
- `screenshots/` — captures of the exported covers and the editor
- `main.ts`, `vendor/makefun-app.ts` — the hand-in program and library

MIT licensed — see `LICENSE`.

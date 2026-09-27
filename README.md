# NIGHTFURY — Single Speed King

The Nightfury cycles site of **Master Aadhithyavarman** — *Start anywhere. Stop nowhere.*

- **Night Patrol** hero: the Night Fury flying over the master (Night / Day Stormcutter-hybrid / Rain), click to fire.
- **Chapter 04 — The Master**, **05 — The Defense** (scripted battle), **06 — Defend the Nightfury** (mini-game with the Cycling Squad of Unity).
- Plasma + roar sound effects, synthesised in the browser (no audio files).

## Layout

| Path | What |
|---|---|
| `public/` | The deployable static site (this is what Render serves). |
| `_build/patch.py` | Rebuilds `public/` from the original Emergent bundle + the files below. |
| `_build/*.js`, `_build/nightfury-patrol.html` | Scene, section, game and sound source. |
| `_build/bundle.original.js` | The original site bundle the patch starts from — do not edit. |

## Change something, then rebuild

```bash
python _build/patch.py
```

Preview locally:

```bash
python -m http.server 8766 --directory public
```

## Deploy on Render (free)

1. Push this repo to GitHub.
2. Render dashboard → **New → Blueprint** → pick this repo (it reads `render.yaml`).
   Or **New → Static Site**: Build command `echo ok`, Publish directory `public`.
3. Every push to `main` redeploys automatically.

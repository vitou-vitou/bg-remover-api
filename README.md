---
title: bg-remover-api
emoji: 🖼️
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 3000
pinned: false
---

# bg-remover-api

Zero-cost background removal. Model runs locally via IMG.LY (AGPL). Stdlib `http` API + free in-browser demo.

## Free live demo (GitHub Pages)

**https://vitou-vitou.github.io/bg-remover-api/**

Runs entirely in the browser (`@imgly/background-removal`). Image never uploads. $0 hosting forever.

## API (needs ≥1GB RAM)

`onnxruntime-node` peaks ~**1GB RSS** even on tiny images. Free Render (512MB) **cannot** run `/remove` (OOM → 502). Keep the free Render service for health checks only, or upgrade to **Standard 2GB** once revenue covers it (~$25/mo).

Hugging Face Docker Spaces also require **PRO** now for free CPU — not a free path.

### Run locally

```bash
npm install
npm start
npm test
```

### Endpoint

`POST /remove`

Send one of:
- Raw image bytes with `Content-Type: image/png` (or jpeg/webp)
- JSON `{"url": "https://.../photo.jpg"}`
- JSON `{"image": "<base64>"}`

Query params (all optional):

| param  | values                              | default      |
|--------|-------------------------------------|--------------|
| format | `png` `jpeg` `webp`                 | `png`        |
| model  | `small` (~40MB) `medium` (~80MB)    | `small`      |
| type   | `foreground` `background` `mask`    | `foreground` |

Returns the processed image bytes.

### Security

- Input capped at 10MB.
- Set `PROXY_SECRET` → requires `X-RapidAPI-Proxy-Secret`. Leave unset for local use.

### Docker / Render

```bash
docker build -t bg-remover-api .
docker run -p 3000:3000 -e PROXY_SECRET=your-secret bg-remover-api
```

`render.yaml` stays on **free** until you earn. Then bump `plan: standard` and re-deploy for RapidAPI.

## Skipped until revenue

- RapidAPI listing (needs stable ≥1GB host)
- Rate limiting beyond RapidAPI proxy
- Model pre-bake optimizations

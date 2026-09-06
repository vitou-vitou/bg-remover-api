# bg-remover-api

Zero-cost background removal. Model runs locally via IMG.LY (AGPL). Stdlib `http` API + free in-browser demo.

## Free live demo (GitHub Pages)

**https://vitou-vitou.github.io/bg-remover-api/**

Runs entirely in the browser (`@imgly/background-removal`). Images never upload. $0 hosting forever. Batch upload + ZIP download.

## API (needs ≥1GB RAM)

The Node API (`server.js`) is verified working: real removal returns 200 + valid PNG in ~2s, and the `PROXY_SECRET` gate returns 401 without / 200 with the header.

> **Hosting caveat:** `onnxruntime-node` peaks ~**1GB RSS** even on tiny images. Free 512MB hosts (Render free, Fly free) **OOM → 502**. Hugging Face Docker Spaces now need PRO. So the hosted API needs a **≥1GB paid host** (e.g. Render Standard 2GB, ~$25/mo). Deploy it only once the free browser demo proves demand. Until then the browser demo covers all real usage at $0.

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

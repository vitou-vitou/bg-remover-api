# bg-remover-api

Zero-cost background removal. No per-image fees, no privacy leak — model runs locally via `@imgly/background-removal-node` (AGPL). Stdlib `http` only, one dependency.

## Run

```bash
npm install       # installs one dep (~130MB, ONNX models bundled — no runtime download)
npm start         # listens on PORT (default 3000)
npm test          # request-parsing self-check (no network)
```

## Endpoint

`POST /remove`

Send one of:
- Raw image bytes with `Content-Type: image/png` (or jpeg/webp)
- JSON `{"url": "https://.../photo.jpg"}`
- JSON `{"image": "<base64>"}`

Query params (all optional):

| param  | values                              | default      |
|--------|-------------------------------------|--------------|
| format | `png` `jpeg` `webp`                 | `png`        |
| model  | `small` (~40MB) `medium` (~80MB)    | `medium`     |
| type   | `foreground` `background` `mask`    | `foreground` |

Returns the processed image bytes (`Content-Type` = chosen format).

### Examples

```bash
# raw bytes
curl -X POST --data-binary "@photo.jpg" -H "Content-Type: image/jpeg" \
  "http://localhost:3000/remove?format=png" -o out.png

# from URL
curl -X POST -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/photo.jpg"}' \
  "http://localhost:3000/remove" -o out.png
```

## Limits & security

- Input capped at 10MB (`MAX_BYTES` in `server.js`).
- Set `PROXY_SECRET` env → requires header `X-RapidAPI-Proxy-Secret` on every call. Leave unset for open/local use. **Set it before exposing publicly.**

## Sell on RapidAPI

1. Deploy (Docker below, or any Node host). Set `PROXY_SECRET`.
2. RapidAPI → Add API → point to your base URL → set the same secret as the proxy header.
3. Define `POST /remove`, add pricing tiers (e.g. free 50/mo, then $0.005/call).

## Docker

```bash
docker build -t bg-remover-api .
docker run -p 3000:3000 -e PROXY_SECRET=your-secret bg-remover-api
```

> The ONNX model files ship **inside** the npm package (`node_modules/@imgly/background-removal-node/dist/`), and `server.js` points `publicPath` there. So there is **no runtime download** — first call is fast and works offline. Trade-off: `node_modules` is ~130MB (bundled models).

## Skipped (add when needed)

- Rate limiting / API-key management → RapidAPI proxy handles it; add in-app only if self-hosting the marketplace.
- Concurrency queue → add when you see CPU saturation under load.
- Model pre-bake in image → add if cold-start latency hurts.

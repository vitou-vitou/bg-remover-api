// Background Remover API — stdlib http only, no framework (YAGNI).
// POST /remove  body = raw image bytes (Content-Type: image/*)
//                    or JSON {"url":"https://..."} / {"image":"<base64>"}
// query: ?format=png|jpeg|webp  &model=small|medium  &type=foreground|background|mask
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { removeBackground } from "@imgly/background-removal-node";

const PORT = process.env.PORT || 3000;
const MAX_BYTES = 10 * 1024 * 1024; // 10MB input cap (trust boundary)
const PROXY_SECRET = process.env.PROXY_SECRET; // set on RapidAPI: X-RapidAPI-Proxy-Secret

// Serve wasm/onnx from local install, not IMG.LY servers (faster, private).
const publicPath =
  pathToFileURL(path.resolve("node_modules/@imgly/background-removal-node/dist")).toString() + "/";

const FORMATS = { png: "image/png", jpeg: "image/jpeg", jpg: "image/jpeg", webp: "image/webp" };
const json = (res, code, obj) =>
  res.writeHead(code, { "content-type": "application/json" }).end(JSON.stringify(obj));

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BYTES) {
        reject(Object.assign(new Error("Payload too large (max 10MB)"), { code: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// Resolve request into an image source removeBackground() accepts.
async function toImageSource(req, body) {
  const ct = req.headers["content-type"] || "";
  if (ct.startsWith("image/")) return new Blob([body], { type: ct }); // typed Blob (bare Buffer fails)
  if (ct.includes("application/json")) {
    const { url, image } = JSON.parse(body.toString() || "{}");
    if (url) return String(url);
    if (image) return new Blob([Buffer.from(image, "base64")], { type: "image/png" });
    throw Object.assign(new Error('JSON must include "url" or "image" (base64)'), { code: 400 });
  }
  throw Object.assign(new Error("Send image/* bytes or application/json"), { code: 415 });
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && u.pathname === "/") {
    return json(res, 200, {
      name: "bg-remover-api",
      usage: "POST /remove  (image/* bytes | JSON {url|image})",
      query: { format: Object.keys(FORMATS), model: ["small", "medium"], type: ["foreground", "background", "mask"] },
    });
  }

  if (req.method !== "POST" || u.pathname !== "/remove")
    return json(res, 404, { error: "Not found. Use POST /remove" });

  // Optional auth: enforced only when PROXY_SECRET is set (RapidAPI injects the header).
  if (PROXY_SECRET && req.headers["x-rapidapi-proxy-secret"] !== PROXY_SECRET)
    return json(res, 401, { error: "Unauthorized" });

  try {
    const body = await readBody(req);
    if (!body.length) return json(res, 400, { error: "Empty body" });

    const src = await toImageSource(req, body);
    const fmt = FORMATS[(u.searchParams.get("format") || "png").toLowerCase()] || "image/png";
    const model = u.searchParams.get("model") === "small" ? "small" : "medium";
    const type = ["foreground", "background", "mask"].includes(u.searchParams.get("type"))
      ? u.searchParams.get("type")
      : "foreground";

    const blob = await removeBackground(src, { publicPath, model, output: { format: fmt, type } });
    const out = Buffer.from(await blob.arrayBuffer());
    res.writeHead(200, { "content-type": fmt, "content-length": out.length }).end(out);
  } catch (err) {
    json(res, err.code || 500, { error: err.message || "Processing failed" });
  }
});

// Listen only when run directly (`node server.js`), not when imported by test.js.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  server.listen(PORT, () => console.log(`bg-remover-api on :${PORT}`));

export { server, toImageSource }; // for test.js

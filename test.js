// Self-check: no framework, no network, no model download.
// Verifies request parsing + routing logic. Run: npm test
import assert from "node:assert";
import sharp from "sharp";
import { toImageSource } from "./server.js";

const mkReq = (ct) => ({ headers: { "content-type": ct } });

// A real 4x4 PNG so sharp metadata/resize works.
const tinyPng = await sharp({ create: { width: 4, height: 4, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();

// image/* bytes -> typed Blob (small image passes through, still a Blob)
const b = await toImageSource(mkReq("image/png"), tinyPng);
assert.ok(b instanceof Blob && b.type.startsWith("image/"), "image bytes -> Blob");

// JSON url -> string passthrough
const s = await toImageSource(mkReq("application/json"), Buffer.from(JSON.stringify({ url: "http://x/y.jpg" })));
assert.strictEqual(s, "http://x/y.jpg", "json url -> string");

// JSON base64 -> Blob
const b2 = await toImageSource(mkReq("application/json"), Buffer.from(JSON.stringify({ image: tinyPng.toString("base64") })));
assert.ok(b2 instanceof Blob, "json base64 -> Blob");

// Oversized image gets downscaled to <= MAX_EDGE (still a Blob)
const big = await sharp({ create: { width: 3000, height: 100, channels: 4, background: { r: 1, g: 1, b: 1, alpha: 1 } } }).png().toBuffer();
const b3 = await toImageSource(mkReq("image/png"), big);
const b3meta = await sharp(Buffer.from(await b3.arrayBuffer())).metadata();
assert.ok(b3meta.width <= 1500, "oversized image downscaled");

// unsupported content-type -> 415
await assert.rejects(() => toImageSource(mkReq("text/plain"), Buffer.from("x")), (e) => e.code === 415, "reject text/plain");

// JSON missing fields -> 400
await assert.rejects(() => toImageSource(mkReq("application/json"), Buffer.from("{}")), (e) => e.code === 400, "reject empty json");

console.log("ok - all request-parsing checks passed");

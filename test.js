// Self-check: no framework, no network, no model download.
// Verifies request parsing + routing logic. Run: npm test
import assert from "node:assert";
import { toImageSource } from "./server.js";

const mkReq = (ct) => ({ headers: { "content-type": ct } });

// image/* bytes -> typed Blob
const b = await toImageSource(mkReq("image/png"), Buffer.from([1, 2, 3]));
assert.ok(b instanceof Blob && b.type === "image/png", "image bytes -> Blob");

// JSON url -> string passthrough
const s = await toImageSource(mkReq("application/json"), Buffer.from(JSON.stringify({ url: "http://x/y.jpg" })));
assert.strictEqual(s, "http://x/y.jpg", "json url -> string");

// JSON base64 -> Blob
const b2 = await toImageSource(mkReq("application/json"), Buffer.from(JSON.stringify({ image: Buffer.from("hi").toString("base64") })));
assert.ok(b2 instanceof Blob, "json base64 -> Blob");

// unsupported content-type -> 415
await assert.rejects(() => toImageSource(mkReq("text/plain"), Buffer.from("x")), (e) => e.code === 415, "reject text/plain");

// JSON missing fields -> 400
await assert.rejects(() => toImageSource(mkReq("application/json"), Buffer.from("{}")), (e) => e.code === 400, "reject empty json");

console.log("ok - all request-parsing checks passed");

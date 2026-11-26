import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const __dir = dirname(fileURLToPath(import.meta.url));
const vector = JSON.parse(
  readFileSync(join(__dir, "testdata/vectors.json"), "utf8"),
);

describe("aes-256-gcm+v1", () => {
  it("matches shared API vector", async () => {
    const { aesGcmOpenVector } = await import("./aesgcm.ts");
    await aesGcmOpenVector(vector);
  });

  it("round-trips seal/open", async () => {
    const { aesGcmSeal, aesGcmOpen } = await import("./aesgcm.ts");
    const key = new Uint8Array(32);
    key.fill(7);
    const json = '{"format":"proyecto-orden-export","version":1,"lists":[],"tasks":[]}';
    const env = await aesGcmSeal(json, key, "web-v1", "dev-1");
    assert.equal(env.algorithm, "aes-256-gcm+v1");
    const back = await aesGcmOpen(env, key);
    assert.equal(back, json);
  });
});
import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("stub e2e envelope", () => {
  it("round-trips export JSON", async () => {
    const { stubSeal, stubOpen, STUB_ALGORITHM } = await import("./e2e.ts");
    const json = '{"format":"proyecto-orden-export","version":1,"lists":[],"tasks":[]}';
    const env = stubSeal(json, "device-1");
    assert.equal(env.algorithm, STUB_ALGORITHM);
    assert.equal(stubOpen(env), json);
  });

  it("rejects non-stub algorithms", async () => {
    const { stubOpen } = await import("./e2e.ts");
    assert.throws(
      () =>
        stubOpen({
          algorithm: "aes-256-gcm+v1",
          ciphertext: "YQ==",
        }),
      /invalid_envelope/,
    );
  });
});
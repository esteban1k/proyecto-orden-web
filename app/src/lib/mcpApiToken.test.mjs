import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";

const storage = new Map();

describe("mcp api token", () => {
  beforeEach(() => {
    globalThis.localStorage = {
      getItem: (k) => storage.get(k) ?? null,
      setItem: (k, v) => storage.set(k, v),
      removeItem: (k) => storage.delete(k),
    };
    storage.clear();
  });

  afterEach(() => {
    delete globalThis.localStorage;
  });

  it("masks token for display", async () => {
    const { maskToken } = await import("./mcpApiToken.ts");
    assert.equal(maskToken("short"), "••••••••");
    assert.match(maskToken("lc_abcdefgh1234567890abcd"), /^lc_abcde…/);
  });

  it("creates and rotates per user", async () => {
    const {
      getOrCreateMcpApiToken,
      rotateMcpApiToken,
      readMcpApiToken,
    } = await import("./mcpApiToken.ts");
    const a = getOrCreateMcpApiToken("user-1");
    const b = getOrCreateMcpApiToken("user-1");
    assert.equal(a.token, b.token);
    const c = rotateMcpApiToken("user-1");
    assert.notEqual(a.token, c.token);
    assert.equal(readMcpApiToken("user-2"), null);
  });
});
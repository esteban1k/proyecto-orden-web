import assert from "node:assert/strict";
import { describe, it, mock, afterEach } from "node:test";

describe("mcp PAT api client", { concurrency: 1 }, () => {
  afterEach(() => {
    mock.restoreAll();
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  });

  it("returns null on 404", async () => {
    mock.method(globalThis, "fetch", async () => ({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ error: "not_found" }),
    }));
    const { fetchMcpPat } = await import("./mcpPat.ts");
    const res = await fetchMcpPat("sess");
    assert.equal(res, null);
  });

  it("returns token on 200", async () => {
    mock.method(globalThis, "fetch", async () => ({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          token: "lc_pat_abcdef",
          rotated_at: "2026-11-26T00:00:00Z",
        }),
    }));
    const { fetchMcpPat } = await import("./mcpPat.ts");
    const res = await fetchMcpPat("sess");
    assert.ok(res);
    assert.equal(res.token, "lc_pat_abcdef");
  });
});
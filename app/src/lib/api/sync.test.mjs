import assert from "node:assert/strict";
import { describe, it, mock, afterEach } from "node:test";

describe("sync api client", { concurrency: 1 }, () => {
  afterEach(() => {
    mock.restoreAll();
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  });

  it("maps HTTP 501 to sync_not_ready", async () => {
    mock.method(globalThis, "fetch", async () => ({
      ok: false,
      status: 501,
      statusText: "Not Implemented",
      text: async () =>
        JSON.stringify({ status: "not_implemented", milestone: "M0" }),
    }));
    const { getSnapshot } = await import("./sync.ts");
    await assert.rejects(
      () => getSnapshot("token"),
      (err) => {
        assert.equal(err.code, "sync_not_ready");
        assert.equal(err.status, 501);
        return true;
      },
    );
  });

  it("maps not_implemented body to sync_not_ready", async () => {
    mock.method(globalThis, "fetch", async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({ status: "not_implemented" }),
    }));
    const { getSnapshot } = await import("./sync.ts");
    await assert.rejects(
      () => getSnapshot("token"),
      (err) => err.code === "sync_not_ready",
    );
  });

  it("returns snapshot JSON on success", async () => {
    mock.method(globalThis, "fetch", async (_url, init) => {
      const headers = new Headers(init?.headers);
      assert.equal(headers.get("Authorization"), "Bearer sess");
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () =>
          JSON.stringify({
            server_revision: 2,
            has_data: true,
            envelope: { algorithm: "stub", ciphertext: "YQ==" },
          }),
      };
    });
    const { getSnapshot } = await import("./sync.ts");
    const snap = await getSnapshot("sess");
    assert.equal(snap.server_revision, 2);
    assert.equal(snap.has_data, true);
  });
});
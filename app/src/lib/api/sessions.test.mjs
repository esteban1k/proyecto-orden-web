import assert from "node:assert/strict";
import { describe, it, mock, afterEach } from "node:test";

describe("sessions api client", { concurrency: 1 }, () => {
  afterEach(() => {
    mock.restoreAll();
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  });

  it("lists sessions with bearer", async () => {
    mock.method(globalThis, "fetch", async (_url, init) => {
      const headers = new Headers(init?.headers);
      assert.equal(headers.get("Authorization"), "Bearer sess");
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            sessions: [{ session_id: "s1", device_label: "Web" }],
            cap: 5,
          }),
      };
    });
    const { listSessions } = await import("./sessions.ts");
    const res = await listSessions("sess");
    assert.equal(res.sessions.length, 1);
    assert.equal(res.cap, 5);
  });

  it("revokes by DELETE", async () => {
    mock.method(globalThis, "fetch", async (url, init) => {
      assert.match(String(url), /\/v1\/auth\/sessions\/s1/);
      assert.equal(init?.method, "DELETE");
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ status: "revoked" }),
      };
    });
    const { revokeSession } = await import("./sessions.ts");
    await revokeSession("sess", "s1");
  });
});
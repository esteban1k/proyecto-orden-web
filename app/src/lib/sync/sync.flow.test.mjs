import assert from "node:assert/strict";
import { describe, it, mock, afterEach, beforeEach } from "node:test";

const storage = new Map();

describe("sync wizard flow (API stub)", { concurrency: 1 }, () => {
  beforeEach(() => {
    globalThis.localStorage = {
      getItem: (k) => storage.get(k) ?? null,
      setItem: (k, v) => storage.set(k, v),
      removeItem: (k) => storage.delete(k),
    };
    storage.clear();
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_SYNC_E2E_STUB;
  });

  afterEach(() => {
    mock.restoreAll();
    delete globalThis.localStorage;
  });

  it("PUT aes envelope then GET round-trip via mocked API", async () => {
    const state = { revision: 0, snap: null };
    const exportJson = JSON.stringify({
      format: "proyecto-orden-export",
      version: 1,
      lists: [{ id: "l1", title: "Casa", sortOrder: 1 }],
      tasks: [{ id: "t1", listId: "l1", title: "Pan", status: "pendiente" }],
    });

    const { sealForUpload } = await import("./envelope.ts");
    const envelope = await sealForUpload(exportJson, "user-abc", "device-1");

    mock.method(globalThis, "fetch", async (url, init) => {
      const path = String(url);
      if (path.endsWith("/v1/sync/snapshot") && init?.method === "PUT") {
        const body = JSON.parse(String(init.body));
        state.revision += 1;
        state.snap = {
          server_revision: state.revision,
          has_data: true,
          envelope: body.envelope,
        };
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({ server_revision: state.revision }),
        };
      }
      if (path.endsWith("/v1/sync/snapshot") && (!init?.method || init.method === "GET")) {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify(state.snap ?? { server_revision: 0 }),
        };
      }
      return { ok: false, status: 404, text: async () => "{}" };
    });

    const { putSnapshot, getSnapshot } = await import("../api/sync.ts");
    await putSnapshot("sess", {
      base_revision: 0,
      envelope,
      manifest: { lists: [], tasks: [] },
      assistant_manifest: { lists: [], tasks: [] },
      device_id: "device-1",
    });
    const snap = await getSnapshot("sess");
    assert.equal(snap.has_data, true);
    assert.equal(snap.envelope.algorithm, "aes-256-gcm+v1");

    const { openEnvelope } = await import("./envelope.ts");
    const opened = await openEnvelope(snap.envelope, "user-abc");
    assert.equal(opened, exportJson);
  });
});
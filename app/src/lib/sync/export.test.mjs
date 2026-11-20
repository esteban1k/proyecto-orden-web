import assert from "node:assert/strict";
import { describe, it } from "node:test";

const fixture = {
  format: "proyecto-orden-export",
  version: 1,
  prefs: { userName: "Esteban" },
  lists: [
    { id: "l1", title: "Casa", iconKey: "casa", sortOrder: 1 },
    { id: "l2", title: "Trabajo", iconKey: "trabajo", sortOrder: 2 },
  ],
  tasks: [
    { id: "t1", listId: "l1", title: "Leche", status: "pendiente" },
    { id: "t2", listId: "l1", title: "Pan", status: "completada" },
    { id: "t3", listId: "l2", title: "Informe", completed: true },
  ],
};

describe("export sync helpers", () => {
  it("parses proyecto-orden-export and builds manifests", async () => {
    const {
      parseExportDocument,
      buildManifest,
      buildAssistantManifest,
      summarizeLists,
    } = await import("./export.ts");
    const doc = parseExportDocument(fixture);
    assert.equal(doc.lists.length, 2);
    const manifest = buildManifest(doc);
    assert.equal(manifest.lists.length, 2);
    assert.equal(manifest.tasks.length, 3);
    assert.match(manifest.lists[0].content_hash, /^fnv1a-/);
    const assistant = buildAssistantManifest(doc);
    assert.equal(assistant.prefs?.nickname, "Esteban");
    const summary = summarizeLists(doc);
    assert.equal(summary[0].active, 1);
    assert.equal(summary[0].completed, 1);
    assert.equal(summary[1].completed, 1);
  });

  it("rejects unknown export format", async () => {
    const { parseExportDocument } = await import("./export.ts");
    assert.throws(
      () => parseExportDocument({ format: "other", version: 1, lists: [], tasks: [] }),
      /invalid_envelope/,
    );
  });

  it("detects snapshot data presence", async () => {
    const { snapshotHasUserData } = await import("./export.ts");
    assert.equal(snapshotHasUserData({ has_data: false }), false);
    assert.equal(
      snapshotHasUserData({ envelope: { ciphertext: "YQ==" } }),
      true,
    );
    assert.equal(snapshotHasUserData({ has_data: true, envelope: null }), true);
  });
});
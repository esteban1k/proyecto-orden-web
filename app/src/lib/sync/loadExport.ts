import { getSnapshot } from "@/lib/api/sync";
import { openEnvelope } from "@/lib/sync/envelope";
import {
  parseExportJson,
  snapshotHasUserData,
} from "@/lib/sync/export";
import type { ExportDocument } from "@/lib/sync/types";

export type LoadedExport =
  | { kind: "empty" }
  | { kind: "ready"; doc: ExportDocument; serverRevision: number };

export async function loadSyncedExport(
  sessionToken: string,
  userId: string,
): Promise<LoadedExport> {
  const snap = await getSnapshot(sessionToken);
  const revision = snap.server_revision ?? 0;
  if (!snapshotHasUserData(snap) || !snap.envelope) {
    return { kind: "empty" };
  }
  const plaintext = await openEnvelope(snap.envelope, userId);
  const doc = parseExportJson(plaintext);
  return { kind: "ready", doc, serverRevision: revision };
}
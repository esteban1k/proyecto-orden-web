"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { t } from "@/i18n";
import { getSnapshot } from "@/lib/api/sync";
import { userFacingError } from "@/lib/errors";
import { readSession } from "@/lib/session";
import {
  parseExportJson,
  snapshotHasUserData,
  summarizeLists,
} from "@/lib/sync/export";
import { openEnvelope } from "@/lib/sync/envelope";
import type { ListSummary } from "@/lib/sync/types";
import { FirstSyncWizard } from "./FirstSyncWizard";
import { ListasPanel } from "./ListasPanel";

type ViewState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "wizard"; revision: number }
  | { kind: "lists"; revision: number; lists: ListSummary[] };

export default function ListasPage() {
  const [view, setView] = useState<ViewState>({ kind: "loading" });

  const load = useCallback(async () => {
    const session = readSession();
    if (!session?.session_token) return;
    setView({ kind: "loading" });
    try {
      const snap = await getSnapshot(session.session_token);
      const revision = snap.server_revision ?? 0;
      if (!snapshotHasUserData(snap)) {
        setView({ kind: "wizard", revision });
        return;
      }
      if (!snap.envelope) {
        setView({ kind: "error", message: t("errors.sync_empty") });
        return;
      }
      const plaintext = await openEnvelope(snap.envelope, session.user_id);
      const doc = parseExportJson(plaintext);
      setView({
        kind: "lists",
        revision,
        lists: summarizeLists(doc),
      });
    } catch (err) {
      setView({ kind: "error", message: userFacingError(err) });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onUploaded = useCallback(
    (revision: number) => {
      void (async () => {
        const session = readSession();
        if (!session?.session_token) return;
        try {
          const snap = await getSnapshot(session.session_token);
          const plaintext = snap.envelope
            ? await openEnvelope(snap.envelope, session.user_id)
            : "";
          const doc = parseExportJson(plaintext);
          setView({
            kind: "lists",
            revision: snap.server_revision ?? revision,
            lists: summarizeLists(doc),
          });
        } catch {
          void load();
        }
      })();
    },
    [load],
  );

  return (
    <AuthGuard>
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">{t("listas.title")}</h1>
        {view.kind === "loading" ? (
          <p className="text-stone-500">{t("loading")}</p>
        ) : null}
        {view.kind === "error" ? (
          <p className="text-red-700" role="alert">
            {view.message}
          </p>
        ) : null}
        {view.kind === "wizard" ? (
          <FirstSyncWizard
            serverRevision={view.revision}
            onUploaded={onUploaded}
          />
        ) : null}
        {view.kind === "lists" ? (
          <ListasPanel lists={view.lists} serverRevision={view.revision} />
        ) : null}
      </section>
    </AuthGuard>
  );
}
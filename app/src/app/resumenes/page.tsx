"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { t } from "@/i18n";
import { userFacingError } from "@/lib/errors";
import { readSession } from "@/lib/session";
import {
  resumenTotals,
  summarizeLists,
  summaryPrefsFromDoc,
} from "@/lib/sync/export";
import { loadSyncedExport } from "@/lib/sync/loadExport";

type ViewState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "empty" }
  | {
      kind: "ready";
      serverRevision: number;
      totals: ReturnType<typeof resumenTotals>;
      prefs: ReturnType<typeof summaryPrefsFromDoc>;
      lists: ReturnType<typeof summarizeLists>;
    };

export default function ResumenesPage() {
  const [view, setView] = useState<ViewState>({ kind: "loading" });

  const load = useCallback(async () => {
    const session = readSession();
    if (!session?.session_token) return;
    setView({ kind: "loading" });
    try {
      const loaded = await loadSyncedExport(
        session.session_token,
        session.user_id,
      );
      if (loaded.kind === "empty") {
        setView({ kind: "empty" });
        return;
      }
      const { doc, serverRevision } = loaded;
      setView({
        kind: "ready",
        serverRevision,
        totals: resumenTotals(doc),
        prefs: summaryPrefsFromDoc(doc),
        lists: summarizeLists(doc),
      });
    } catch (err) {
      setView({ kind: "error", message: userFacingError(err) });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AuthGuard>
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold">{t("resumenes.title")}</h1>
        <p className="text-sm text-stone-600">{t("resumenes.hint")}</p>
        {view.kind === "loading" ? (
          <p className="text-stone-500">{t("loading")}</p>
        ) : null}
        {view.kind === "error" ? (
          <p className="text-red-700" role="alert">
            {view.message}
          </p>
        ) : null}
        {view.kind === "empty" ? (
          <div className="rounded-lg border border-stone-200 bg-white p-4 text-stone-600">
            <p>{t("resumenes.noData")}</p>
            <Link href="/listas/" className="mt-2 inline-block text-emerald-800 underline">
              {t("resumenes.goListas")}
            </Link>
          </div>
        ) : null}
        {view.kind === "ready" ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label={t("resumenes.statLists")} value={view.totals.lists} />
              <StatCard label={t("resumenes.statPending")} value={view.totals.pending} />
              <StatCard label={t("resumenes.statDone")} value={view.totals.completed} />
            </div>
            <div className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-700">
              <h2 className="mb-2 font-medium">{t("resumenes.prefsTitle")}</h2>
              <dl className="space-y-1">
                <PrefRow
                  label={t("resumenes.daily")}
                  value={formatBool(view.prefs.dailyEnabled)}
                />
                <PrefRow
                  label={t("resumenes.weekly")}
                  value={formatBool(view.prefs.weeklyEnabled)}
                />
                <PrefRow
                  label={t("resumenes.reminders")}
                  value={formatBool(view.prefs.remindersMaster)}
                />
                {view.prefs.scheduleNote ? (
                  <PrefRow
                    label={t("resumenes.schedule")}
                    value={view.prefs.scheduleNote}
                  />
                ) : null}
                {view.prefs.nickname ? (
                  <PrefRow label={t("resumenes.nickname")} value={view.prefs.nickname} />
                ) : null}
              </dl>
              <p className="mt-3 text-xs text-stone-500">{t("resumenes.prefsNote")}</p>
            </div>
            {view.totals.pending > 0 ? (
              <div className="rounded-lg border border-stone-200 bg-white p-4">
                <h2 className="mb-2 font-medium">{t("resumenes.pendingByList")}</h2>
                <ul className="divide-y divide-stone-100 text-sm">
                  {view.lists
                    .filter((list) => list.active > 0)
                    .map((list) => (
                      <li
                        key={list.id}
                        className="flex justify-between gap-2 py-2"
                      >
                        <span>{list.title}</span>
                        <span className="text-stone-600">
                          {list.active} {t("listas.activeShort")}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ) : (
              <p className="text-stone-600">{t("resumenes.allDone")}</p>
            )}
            <p className="text-xs text-stone-500">
              {t("listas.serverRevisionPrefix")} {view.serverRevision}
            </p>
          </div>
        ) : null}
      </section>
    </AuthGuard>
  );
}

function formatBool(value: boolean | null): string {
  if (value === true) return "Sí";
  if (value === false) return "No";
  return "—";
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function PrefRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-stone-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
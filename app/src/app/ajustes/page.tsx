"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { t } from "@/i18n";
import { listSessions, revokeSession, type ActiveSessionRow } from "@/lib/api/sessions";
import { wipeSync } from "@/lib/api/sync";
import { userFacingError } from "@/lib/errors";
import {
  getOrCreateMcpApiToken,
  maskToken,
  rotateMcpApiToken,
  type McpApiTokenRecord,
} from "@/lib/mcpApiToken";
import { clearSession, readSession } from "@/lib/session";

type ViewState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "ready";
      sessions: ActiveSessionRow[];
      cap: number;
      mcpToken: McpApiTokenRecord;
      expiresAt: string;
    };

export default function AjustesPage() {
  const router = useRouter();
  const [view, setView] = useState<ViewState>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [wipeConfirm, setWipeConfirm] = useState(false);

  const load = useCallback(async () => {
    const session = readSession();
    if (!session?.session_token) return;
    setView({ kind: "loading" });
    try {
      const res = await listSessions(session.session_token);
      const mcpToken = getOrCreateMcpApiToken(session.user_id);
      setView({
        kind: "ready",
        sessions: res.sessions ?? [],
        cap: res.cap ?? 5,
        mcpToken,
        expiresAt: session.expires_at,
      });
    } catch (err) {
      setView({ kind: "error", message: userFacingError(err) });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const copyText = useCallback(async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }, []);

  const onRotateMcpToken = useCallback(() => {
    const session = readSession();
    if (!session) return;
    const next = rotateMcpApiToken(session.user_id);
    setView((prev) =>
      prev.kind === "ready" ? { ...prev, mcpToken: next } : prev,
    );
  }, []);

  const onRevoke = useCallback(
    async (sessionId: string, isCurrent: boolean) => {
      const session = readSession();
      if (!session?.session_token) return;
      setBusy(true);
      try {
        await revokeSession(session.session_token, sessionId);
        if (isCurrent) {
          clearSession();
          router.push("/login/");
          return;
        }
        await load();
      } catch (err) {
        setView({ kind: "error", message: userFacingError(err) });
      } finally {
        setBusy(false);
      }
    },
    [load, router],
  );

  const onWipe = useCallback(async () => {
    const session = readSession();
    if (!session?.session_token) return;
    setBusy(true);
    try {
      await wipeSync(session.session_token);
      setWipeConfirm(false);
      router.push("/listas/");
    } catch (err) {
      setView({ kind: "error", message: userFacingError(err) });
    } finally {
      setBusy(false);
    }
  }, [router]);

  const current = readSession();

  return (
    <AuthGuard>
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold">{t("ajustes.title")}</h1>
        {view.kind === "loading" ? (
          <p className="text-stone-500">{t("loading")}</p>
        ) : null}
        {view.kind === "error" ? (
          <p className="text-red-700" role="alert">
            {view.message}
          </p>
        ) : null}
        {view.kind === "ready" ? (
          <>
            <Panel title={t("ajustes.accountTitle")}>
              <p className="text-sm text-stone-600">
                {t("ajustes.sessionExpires")}{" "}
                <time dateTime={view.expiresAt}>
                  {new Date(view.expiresAt).toLocaleString("es-AR")}
                </time>
              </p>
            </Panel>

            <Panel title={t("ajustes.mcpSessionTitle")}>
              <p className="text-sm text-stone-600">{t("ajustes.mcpSessionHint")}</p>
              <TokenActions
                masked={maskToken(current?.session_token ?? "")}
                copied={copied === "session"}
                onCopy={() => {
                  const tok = current?.session_token;
                  if (tok) void copyText("session", tok);
                }}
              />
            </Panel>

            <Panel title={t("ajustes.mcpTokenTitle")}>
              <p className="text-sm text-stone-600">{t("ajustes.mcpTokenHint")}</p>
              <p className="font-mono text-sm text-stone-800">
                {maskToken(view.mcpToken.token)}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void copyText("mcp", view.mcpToken.token)}
                  className="rounded-md border border-stone-300 px-3 py-1 text-sm hover:bg-stone-100"
                >
                  {copied === "mcp" ? t("ajustes.copied") : t("ajustes.copy")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onRotateMcpToken}
                  className="rounded-md bg-emerald-800 px-3 py-1 text-sm text-white hover:bg-emerald-900"
                >
                  {t("ajustes.rotateToken")}
                </button>
              </div>
            </Panel>

            <Panel title={t("ajustes.sessionsTitle")}>
              <p className="text-sm text-stone-600">
                {view.sessions.length} / {view.cap} {t("ajustes.sessionsActive")}
              </p>
              <ul className="divide-y divide-stone-100 text-sm">
                {view.sessions.map((row) => {
                  const isCurrent =
                    !!current?.device_id && row.device_id === current.device_id;
                  return (
                    <li
                      key={row.session_id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2"
                    >
                      <div>
                        <p className="font-medium">
                          {row.device_label?.trim() || t("ajustes.unknownDevice")}
                          {isCurrent ? (
                            <span className="ml-2 text-xs text-emerald-800">
                              ({t("ajustes.thisDevice")})
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-stone-500">
                          {t("ajustes.lastSeen")}{" "}
                          {new Date(row.last_seen_at).toLocaleString("es-AR")}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void onRevoke(row.session_id, isCurrent)}
                        className="rounded-md border border-red-300 px-2 py-1 text-red-800 hover:bg-red-50"
                      >
                        {t("ajustes.revoke")}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>

            <Panel title={t("ajustes.wipeTitle")}>
              <p className="text-sm text-stone-600">{t("ajustes.wipeHint")}</p>
              {wipeConfirm ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onWipe()}
                    className="rounded-md bg-red-700 px-3 py-1 text-sm text-white hover:bg-red-800"
                  >
                    {t("ajustes.wipeConfirm")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setWipeConfirm(false)}
                    className="rounded-md border border-stone-300 px-3 py-1 text-sm"
                  >
                    {t("ajustes.cancel")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setWipeConfirm(true)}
                  className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-800"
                >
                  {t("ajustes.wipeStart")}
                </button>
              )}
            </Panel>
          </>
        ) : null}
      </section>
    </AuthGuard>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-stone-200 bg-white p-4">
      <h2 className="text-lg font-medium">{title}</h2>
      {children}
    </div>
  );
}

function TokenActions({
  masked,
  copied,
  onCopy,
}: {
  masked: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-sm">{masked}</span>
      <button
        type="button"
        onClick={onCopy}
        className="rounded-md border border-stone-300 px-3 py-1 text-sm hover:bg-stone-100"
      >
        {copied ? t("ajustes.copied") : t("ajustes.copy")}
      </button>
    </div>
  );
}
"use client";

import { useCallback, useState, type ChangeEvent, type FormEvent } from "react";
import { t } from "@/i18n";
import { putSnapshot } from "@/lib/api/sync";
import { userFacingError } from "@/lib/errors";
import {
  buildAssistantManifest,
  buildManifest,
  encodeExportForUpload,
  parseExportJson,
} from "@/lib/sync/export";
import { stubSeal } from "@/lib/sync/e2e";
import { readSession } from "@/lib/session";

type FirstSyncWizardProps = {
  serverRevision: number;
  onUploaded: (revision: number) => void;
};

export function FirstSyncWizard({
  serverRevision,
  onUploaded,
}: FirstSyncWizardProps) {
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadJson = useCallback(
    async (raw: string) => {
      const session = readSession();
      if (!session?.session_token) {
        setError(t("listas.authRequired"));
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const doc = parseExportJson(raw);
        const plaintext = encodeExportForUpload(doc);
        const envelope = stubSeal(plaintext, session.device_id);
        const res = await putSnapshot(session.session_token, {
          base_revision: serverRevision,
          envelope,
          manifest: buildManifest(doc),
          assistant_manifest: buildAssistantManifest(doc),
          device_id: session.device_id,
        });
        onUploaded(res.server_revision);
      } catch (err) {
        if (err instanceof Error && err.message === "invalid_envelope") {
          setError(t("errors.invalid_envelope"));
        } else {
          setError(userFacingError(err));
        }
      } finally {
        setBusy(false);
      }
    },
    [onUploaded, serverRevision],
  );

  const onFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === "string" ? reader.result : "";
        void uploadJson(text);
      };
      reader.onerror = () => setError(t("errors.invalid_envelope"));
      reader.readAsText(file);
    },
    [uploadJson],
  );

  const onPaste = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const pasted = data.get("payload");
      if (typeof pasted !== "string" || !pasted.trim()) {
        setError(t("listas.wizardPasteEmpty"));
        return;
      }
      void uploadJson(pasted);
    },
    [uploadJson],
  );

  return (
    <div className="space-y-4 rounded-lg border border-dashed border-stone-300 bg-white p-5">
      <div className="space-y-2">
        <h2 className="text-lg font-medium">{t("listas.wizardTitle")}</h2>
        <p className="text-sm text-stone-600">{t("listas.wizardHint")}</p>
      </div>
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-4 py-6 text-sm hover:bg-stone-100">
        <span className="font-medium text-emerald-900">
          {t("listas.wizardChooseFile")}
        </span>
        <input
          type="file"
          accept="application/json,.json"
          className="sr-only"
          disabled={busy}
          onChange={onFile}
        />
        {fileName ? (
          <span className="text-stone-500">{fileName}</span>
        ) : (
          <span className="text-stone-500">{t("listas.wizardNoFile")}</span>
        )}
      </label>
      <form onSubmit={onPaste} className="space-y-2">
        <label className="text-sm font-medium" htmlFor="export-payload">
          {t("listas.wizardPasteLabel")}
        </label>
        <textarea
          id="export-payload"
          name="payload"
          rows={4}
          disabled={busy}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          placeholder={t("listas.wizardPastePlaceholder")}
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
        >
          {busy ? t("listas.wizardUploading") : t("listas.wizardSubmit")}
        </button>
      </form>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
"use client";

import { t } from "@/i18n";
import type { ListSummary } from "@/lib/sync/types";

type ListasPanelProps = {
  lists: ListSummary[];
  serverRevision: number;
};

export function ListasPanel({ lists, serverRevision }: ListasPanelProps) {
  if (lists.length === 0) {
    return (
      <p className="text-stone-600">{t("listas.emptyLists")}</p>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
        {lists.map((list) => (
          <li key={list.id} className="flex items-start justify-between gap-4 px-4 py-3">
            <div>
              <p className="font-medium">{list.title}</p>
              <p className="text-xs text-stone-500">
                {t("listas.iconKey")}: {list.iconKey}
              </p>
            </div>
            <p className="text-right text-sm text-stone-600">
              {list.active} {t("listas.activeShort")} · {list.completed}{" "}
              {t("listas.completedShort")}
            </p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-stone-500">
        {t("listas.serverRevisionPrefix")} {serverRevision}
      </p>
    </div>
  );
}
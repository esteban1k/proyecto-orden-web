"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { t } from "@/i18n";

export default function ListasPage() {
  return (
    <AuthGuard>
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("listas.title")}</h1>
        <p className="text-stone-600">{t("listas.stub")}</p>
      </section>
    </AuthGuard>
  );
}
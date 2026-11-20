"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/i18n";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/listas/");
  }, [router]);

  return <p className="text-stone-500">{t("loading")}</p>;
}
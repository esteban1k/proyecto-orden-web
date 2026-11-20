"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/i18n";
import { isSessionValid, readSession } from "@/lib/session";

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const session = readSession();
    if (isSessionValid(session)) {
      setAllowed(true);
      setReady(true);
      return;
    }
    setAllowed(false);
    setReady(true);
    router.replace("/login/");
  }, [router]);

  if (!ready) {
    return <p className="text-stone-500">{t("loading")}</p>;
  }

  if (!allowed) {
    return <p className="text-stone-500">{t("listas.authRequired")}</p>;
  }

  return <>{children}</>;
}

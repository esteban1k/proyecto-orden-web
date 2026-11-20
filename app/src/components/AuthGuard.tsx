"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/i18n";
import { isSessionValid } from "@/lib/session";
import { useSession } from "@/components/useSession";

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { ready, session } = useSession();
  const allowed = isSessionValid(session);

  useEffect(() => {
    if (ready && !allowed) router.replace("/login/");
  }, [allowed, ready, router]);

  if (!ready || !allowed) {
    return <p className="text-stone-500">{t("loading")}</p>;
  }

  return <>{children}</>;
}

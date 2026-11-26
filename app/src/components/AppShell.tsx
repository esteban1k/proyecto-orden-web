"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { t } from "@/i18n";
import { logout as apiLogout } from "@/lib/api/auth";
import { clearSession, isSessionValid, readSession } from "@/lib/session";
import { useSession } from "@/components/useSession";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, session } = useSession();

  const handleLogout = useCallback(async () => {
    const current = readSession();
    clearSession();
    if (current?.session_token) {
      try {
        await apiLogout(current.session_token);
      } catch {
        /* local session already cleared */
      }
    }
    router.push("/login/");
  }, [router]);

  const loggedIn = ready && isSessionValid(session);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/listas/" className="font-semibold tracking-tight">
            {t("app.name")}
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/listas/"
              className={
                pathname?.startsWith("/listas")
                  ? "font-medium text-emerald-800"
                  : "text-stone-600 hover:text-stone-900"
              }
            >
              {t("nav.listas")}
            </Link>
            {loggedIn ? (
              <>
                <Link
                  href="/resumenes/"
                  className={
                    pathname?.startsWith("/resumenes")
                      ? "font-medium text-emerald-800"
                      : "text-stone-600 hover:text-stone-900"
                  }
                >
                  {t("nav.resumenes")}
                </Link>
                <Link
                  href="/ajustes/"
                  className={
                    pathname?.startsWith("/ajustes")
                      ? "font-medium text-emerald-800"
                      : "text-stone-600 hover:text-stone-900"
                  }
                >
                  {t("nav.ajustes")}
                </Link>
              </>
            ) : null}
            {loggedIn ? (
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-md border border-stone-300 px-3 py-1 hover:bg-stone-100"
              >
                {t("nav.logout")}
              </button>
            ) : (
              <Link
                href="/login/"
                className="rounded-md bg-emerald-800 px-3 py-1 text-white hover:bg-emerald-900"
              >
                {t("nav.login")}
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}

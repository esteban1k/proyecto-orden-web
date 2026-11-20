"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { t } from "@/i18n";
import { ApiError } from "@/lib/api/client";
import {
  googleStart,
  login,
  register,
} from "@/lib/api/auth";
import { userFacingError } from "@/lib/errors";
import { writeSession } from "@/lib/session";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "register") {
        await register(email.trim(), password);
        setInfo(t("register.successHint"));
        router.push(
          `/verify-email/?email=${encodeURIComponent(email.trim())}`,
        );
        return;
      }
      const session = await login(email.trim(), password);
      writeSession(session);
      router.push("/listas/");
    } catch (err) {
      if (err instanceof ApiError && err.code === "email_not_verified") {
        router.push(
          `/verify-email/?email=${encodeURIComponent(email.trim())}`,
        );
        return;
      }
      setError(userFacingError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const res = await googleStart();
      if (res.status === "redirect" && res.url) {
        window.location.href = res.url;
        return;
      }
      if (res.status === "stub") {
        setInfo(res.message);
        return;
      }
      window.location.href = `/v1/auth/google/start?device_label=${encodeURIComponent("Lista Criolla Web")}`;
    } catch (err) {
      setError(userFacingError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <div className="flex gap-2 border-b border-stone-200 pb-2 text-sm">
        <button
          type="button"
          className={
            mode === "login"
              ? "font-medium text-emerald-800"
              : "text-stone-500"
          }
          onClick={() => setMode("login")}
        >
          {t("login.loginTab")}
        </button>
        <button
          type="button"
          className={
            mode === "register"
              ? "font-medium text-emerald-800"
              : "text-stone-500"
          }
          onClick={() => setMode("register")}
        >
          {t("login.registerTab")}
        </button>
      </div>

      <h1 className="text-2xl font-semibold">
        {mode === "login" ? t("login.title") : t("register.title")}
      </h1>

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <label className="block space-y-1 text-sm">
          <span>{t("login.email")}</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{t("login.password")}</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        {info && <p className="text-sm text-stone-600">{info}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-emerald-800 py-2 text-white hover:bg-emerald-900 disabled:opacity-60"
        >
          {mode === "login" ? t("login.submit") : t("register.submit")}
        </button>
      </form>

      <button
        type="button"
        disabled={busy}
        onClick={() => void onGoogle()}
        className="w-full rounded-md border border-stone-300 py-2 hover:bg-stone-100 disabled:opacity-60"
      >
        {t("login.google")}
      </button>

      <p className="text-center text-sm text-stone-500">
        <Link href="/verify-email/" className="underline">
          {t("verify.title")}
        </Link>
      </p>
    </section>
  );
}
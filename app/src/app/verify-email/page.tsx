"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { t } from "@/i18n";
import { login, resendOtp, verifyEmail } from "@/lib/api/auth";
import { userFacingError } from "@/lib/errors";
import { writeSession } from "@/lib/session";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fromQuery = searchParams.get("email");
    if (fromQuery && fromQuery.length <= 254) setEmail(fromQuery);
  }, [searchParams]);

  async function onVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const otp = code.trim();
      if (!/^\d{6}$/.test(otp)) {
        setError(t("errors.invalid_otp"));
        return;
      }
      await verifyEmail(email.trim(), otp);
      if (password.trim()) {
        const session = await login(email.trim(), password);
        writeSession(session);
        router.push("/listas/");
        return;
      }
      setInfo(t("verify.verified"));
      router.push("/login/");
    } catch (err) {
      setError(userFacingError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await resendOtp(email.trim());
      setInfo(t("register.successHint"));
    } catch (err) {
      setError(userFacingError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">{t("verify.title")}</h1>
      <p className="text-sm text-stone-600">{t("verify.hint")}</p>

      <form onSubmit={(e) => void onVerify(e)} className="space-y-4">
        <label className="block space-y-1 text-sm">
          <span>{t("login.email")}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{t("verify.code")}</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2 font-mono tracking-widest"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{t("verify.passwordOptional")}</span>
          <input
            type="password"
            minLength={8}
            autoComplete="current-password"
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
          {t("verify.submit")}
        </button>
      </form>

      <button
        type="button"
        disabled={busy || !email}
        onClick={() => void onResend()}
        className="w-full rounded-md border border-stone-300 py-2 hover:bg-stone-100 disabled:opacity-60"
      >
        {t("verify.resend")}
      </button>

      <p className="text-center text-sm">
        <Link href="/login/" className="text-emerald-800 underline">
          {t("nav.login")}
        </Link>
      </p>
    </section>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="text-stone-500">{t("loading")}</p>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
import { ApiError, apiFetch } from "./client";
import type { SessionPayload } from "../session";
import { isAllowedGoogleRedirect } from "../urlSafety";

export type RegisterResponse = {
  user_id: string;
  email: string;
  email_verified: boolean;
  e2e_envelope?: unknown;
  otp_delivery?: string;
};

export type GoogleStartResponse =
  | { status: "redirect"; url: string; device_label?: string }
  | { status: "stub"; message: string; start_url: null };

function deviceLabel(): string {
  return (
    process.env.NEXT_PUBLIC_DEVICE_LABEL?.trim() || "Lista Criolla Web"
  );
}

export async function register(
  email: string,
  password: string,
): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>("/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      device_label: deviceLabel(),
    }),
  });
}

export async function login(
  email: string,
  password: string,
): Promise<SessionPayload> {
  return apiFetch<SessionPayload>("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      device_label: deviceLabel(),
    }),
  });
}

export async function verifyEmail(
  email: string,
  code: string,
): Promise<{ status: string }> {
  return apiFetch("/v1/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function resendOtp(email: string): Promise<{ status: string }> {
  return apiFetch("/v1/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function logout(sessionToken: string): Promise<void> {
  await apiFetch("/v1/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
}

export async function googleStart(): Promise<GoogleStartResponse> {
  const res = await apiFetch<GoogleStartResponse>(
    `/v1/auth/google/start?redirect=json&device_label=${encodeURIComponent(deviceLabel())}`,
  );
  if (
    res &&
    typeof res === "object" &&
    "status" in res &&
    res.status === "redirect" &&
    "url" in res &&
    typeof res.url === "string" &&
    isAllowedGoogleRedirect(res.url)
  ) {
    return { status: "redirect", url: res.url };
  }
  if (res && typeof res === "object" && "status" in res && res.status === "stub") {
    return { status: "stub", message: "", start_url: null };
  }
  throw new ApiError(0, "generic");
}

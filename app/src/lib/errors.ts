import { ApiError } from "./api/client";
import { t, type MessageKey } from "@/i18n";

const CODE_TO_MESSAGE: Partial<Record<string, MessageKey>> = {
  invalid_credentials: "errors.invalid_credentials",
  email_taken: "errors.email_taken",
  email_not_verified: "errors.email_not_verified",
  invalid_otp: "errors.invalid_otp",
  session_cap: "errors.session_cap",
  no_database: "errors.no_database",
  network: "errors.network",
  sync_not_ready: "errors.sync_not_ready",
  sync_empty: "errors.sync_empty",
  revision_conflict: "errors.revision_conflict",
  invalid_envelope: "errors.invalid_envelope",
  invalid_session: "errors.invalid_session",
  payload_too_large: "errors.payload_too_large",
  e2e_key_missing: "errors.e2e_key_missing",
};

export function userFacingError(err: unknown): string {
  if (err instanceof ApiError) {
    const key = CODE_TO_MESSAGE[err.code];
    if (key) return t(key);
    if (err.code === "network" || err.status === 0) return t("errors.network");
  }
  if (err instanceof Error && err.message === "e2e_key_missing") {
    return t("errors.e2e_key_missing");
  }
  return t("errors.generic");
}
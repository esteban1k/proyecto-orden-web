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
};

export function userFacingError(err: unknown): string {
  if (err instanceof ApiError) {
    const key = CODE_TO_MESSAGE[err.code];
    if (key) return t(key);
    if (err.code === "network" || err.status === 0) return t("errors.network");
  }
  return t("errors.generic");
}
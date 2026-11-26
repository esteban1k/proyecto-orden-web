import { aesGcmOpen, aesGcmSeal, AES_GCM_ALGORITHM } from "./aesgcm";
import { STUB_ALGORITHM, stubOpen, stubSeal } from "./e2e";
import {
  getOrCreateSyncKey,
  readSyncKey,
  syncKeyBytes,
  WEB_SYNC_KEY_ID,
} from "./syncKey";
import type { WireEnvelope } from "./types";

export async function openEnvelope(
  envelope: WireEnvelope,
  userId: string,
): Promise<string> {
  if (envelope.algorithm === STUB_ALGORITHM) {
    return stubOpen(envelope);
  }
  if (envelope.algorithm === AES_GCM_ALGORITHM) {
    const keyId = envelope.key_id ?? WEB_SYNC_KEY_ID;
    const record = readSyncKey(userId);
    if (!record || record.key_id !== keyId) {
      throw new Error("e2e_key_missing");
    }
    return aesGcmOpen(envelope, syncKeyBytes(record));
  }
  throw new Error("invalid_envelope");
}

export async function sealForUpload(
  plaintextUtf8: string,
  userId: string,
  deviceId?: string,
): Promise<WireEnvelope> {
  if (process.env.NEXT_PUBLIC_SYNC_E2E_STUB === "1") {
    return stubSeal(plaintextUtf8, deviceId);
  }
  const key = getOrCreateSyncKey(userId);
  return aesGcmSeal(plaintextUtf8, syncKeyBytes(key), key.key_id, deviceId);
}
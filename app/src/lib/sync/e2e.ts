import type { WireEnvelope } from "./types";

export const STUB_ALGORITHM = "stub";

/** Web v1 stub sealer — mirrors API NoopSealer (plaintext as base64 in ciphertext). */
export function stubSeal(plaintextUtf8: string, deviceId?: string): WireEnvelope {
  const bytes = new TextEncoder().encode(plaintextUtf8);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const envelope: WireEnvelope = {
    algorithm: STUB_ALGORITHM,
    ciphertext: btoa(bin),
  };
  if (deviceId) envelope.device_id = deviceId;
  return envelope;
}

export function stubOpen(envelope: WireEnvelope): string {
  if (envelope.algorithm !== STUB_ALGORITHM) {
    throw new Error("invalid_envelope");
  }
  if (!envelope.ciphertext) {
    throw new Error("invalid_envelope");
  }
  const bin = atob(envelope.ciphertext);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
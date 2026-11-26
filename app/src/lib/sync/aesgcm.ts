import type { WireEnvelope } from "./types";

export const AES_GCM_ALGORITHM = "aes-256-gcm+v1";

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function bufferSource(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function importAesKey(raw: Uint8Array): Promise<CryptoKey> {
  if (raw.length !== 32) throw new Error("invalid_envelope");
  return crypto.subtle.importKey(
    "raw",
    bufferSource(raw),
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function aesGcmOpen(
  envelope: WireEnvelope,
  keyBytes: Uint8Array,
): Promise<string> {
  if (envelope.algorithm !== AES_GCM_ALGORITHM) {
    throw new Error("invalid_envelope");
  }
  if (!envelope.ciphertext || !envelope.nonce) {
    throw new Error("invalid_envelope");
  }
  const key = await importAesKey(keyBytes);
  const nonce = b64ToBytes(envelope.nonce);
  const ciphertext = b64ToBytes(envelope.ciphertext);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: bufferSource(nonce) },
    key,
    bufferSource(ciphertext),
  );
  return new TextDecoder().decode(pt);
}

export async function aesGcmSeal(
  plaintextUtf8: string,
  keyBytes: Uint8Array,
  keyId: string,
  deviceId?: string,
): Promise<WireEnvelope> {
  const key = await importAesKey(keyBytes);
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const pt = new TextEncoder().encode(plaintextUtf8);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: bufferSource(nonce) },
    key,
    bufferSource(pt),
  );
  const envelope: WireEnvelope = {
    algorithm: AES_GCM_ALGORITHM,
    ciphertext: bytesToB64(new Uint8Array(ct)),
    nonce: bytesToB64(nonce),
    key_id: keyId || "v1",
  };
  if (deviceId) envelope.device_id = deviceId;
  return envelope;
}

/** Cross-language vector check (mirrors API `internal/e2e/testdata/vectors.json`). */
export async function aesGcmOpenVector(params: {
  key_b64: string;
  nonce_b64: string;
  ciphertext_b64: string;
  plaintext: string;
}): Promise<void> {
  const key = b64ToBytes(params.key_b64);
  const opened = await aesGcmOpen(
    {
      algorithm: AES_GCM_ALGORITHM,
      key_id: "test-vector-1",
      ciphertext: params.ciphertext_b64,
      nonce: params.nonce_b64,
    },
    key,
  );
  if (opened !== params.plaintext) {
    throw new Error("vector mismatch");
  }
}
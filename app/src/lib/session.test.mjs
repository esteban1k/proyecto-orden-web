import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

const memory = new Map();
globalThis.window = new EventTarget();
globalThis.localStorage = {
  getItem: (key) => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => {
    memory.set(key, String(value));
  },
  removeItem: (key) => {
    memory.delete(key);
  },
};

const session = await import("./session.ts");

function futureIso() {
  return new Date(Date.now() + 60_000).toISOString();
}

function payload(overrides = {}) {
  return {
    session_token: "a".repeat(32),
    expires_at: futureIso(),
    device_id: "device-1",
    user_id: "user-1",
    ...overrides,
  };
}

describe("session", { concurrency: 1 }, () => {
  beforeEach(() => {
    memory.clear();
  });

  it("stores and reads a valid session", () => {
    const value = payload();
    session.writeSession(value);
    assert.deepEqual(session.readSession(), value);
    assert.equal(session.isSessionValid(session.readSession()), true);
  });

  it("rejects header-breaking or short tokens", () => {
    assert.equal(
      session.parseSession(payload({ session_token: "abc\r\nX-Injected: 1" })),
      null,
    );
    assert.throws(() => session.writeSession(payload({ session_token: "short" })));
  });

  it("drops expired and malformed values from storage", () => {
    memory.set(
      session.SESSION_STORAGE_KEY,
      JSON.stringify(payload({ expires_at: new Date(Date.now() - 1000).toISOString() })),
    );
    assert.equal(session.readSession(), null);
    assert.equal(memory.has(session.SESSION_STORAGE_KEY), false);

    memory.set(session.SESSION_STORAGE_KEY, "{not-json");
    assert.equal(session.readSession(), null);
    assert.equal(memory.has(session.SESSION_STORAGE_KEY), false);
  });

  it("clears the session", () => {
    session.writeSession(payload());
    session.clearSession();
    assert.equal(session.readSession(), null);
  });
});

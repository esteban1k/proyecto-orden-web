import assert from "node:assert/strict";
import { describe, it, mock, afterEach } from "node:test";

describe("api client", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("apiUrl returns relative path when base is empty", async () => {
    const { apiUrl } = await import("./client.ts");
    assert.equal(apiUrl("/v1/auth/login"), "/v1/auth/login");
  });

  it("apiFetch maps API error body to thrown error", async () => {
    mock.method(globalThis, "fetch", async () => ({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      text: async () =>
        JSON.stringify({
          error: "email_not_verified",
          detail: "verify first",
        }),
    }));

    const { apiFetch } = await import("./client.ts");
    await assert.rejects(
      () => apiFetch("/v1/auth/login"),
      (err) => {
        assert.equal(err.status, 403);
        assert.equal(err.code, "email_not_verified");
        return true;
      },
    );
  });
});
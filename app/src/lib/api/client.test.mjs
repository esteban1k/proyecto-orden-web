import assert from "node:assert/strict";
import { describe, it, mock, afterEach } from "node:test";

describe("api client", { concurrency: 1 }, () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("apiUrl returns relative path when base is empty", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    const { apiUrl } = await import("./client.ts");
    assert.equal(apiUrl("/v1/auth/login"), "/v1/auth/login");
  });

  it("apiUrl joins an absolute base without a trailing slash", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com/";
    try {
      const { apiUrl } = await import("./client.ts");
      assert.equal(apiUrl("v1/auth/login"), "https://api.example.com/v1/auth/login");
    } finally {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
    }
  });

  it("apiFetch rejects a non-JSON body", async () => {
    mock.method(globalThis, "fetch", async () => ({
      ok: false,
      status: 502,
      statusText: "<script>alert(1)</script>",
      text: async () => "<html>bad gateway</html>",
    }));
    const { apiFetch } = await import("./client.ts");
    await assert.rejects(
      () => apiFetch("/v1/auth/login"),
      (err) => {
        assert.equal(err.status, 502);
        assert.equal(err.code, "generic");
        assert.equal(String(err.message).includes("<script>"), false);
        return true;
      },
    );
  });

  it("apiFetch ignores an error code that is not a token", async () => {
    mock.method(globalThis, "fetch", async () => ({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () => JSON.stringify({ error: "<svg onload=alert(1)>" }),
    }));
    const { apiFetch } = await import("./client.ts");
    await assert.rejects(
      () => apiFetch("/v1/auth/login"),
      (err) => {
        assert.equal(err.code, "generic");
        return true;
      },
    );
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
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveApiProxyTarget } from "./proxyTarget.ts";

describe("dev API proxy target", () => {
  it("defaults to loopback and keeps localhost origin", () => {
    assert.equal(resolveApiProxyTarget(undefined), "http://127.0.0.1:8080");
    assert.equal(resolveApiProxyTarget("http://localhost:8080/v1"), "http://localhost:8080");
    assert.equal(
      resolveApiProxyTarget("https://api.example.com/ignored"),
      "https://api.example.com",
    );
  });

  it("rejects metadata, credentials, and non-loopback http", () => {
    assert.equal(resolveApiProxyTarget("http://169.254.169.254"), "http://127.0.0.1:8080");
    assert.equal(resolveApiProxyTarget("http://example.com"), "http://127.0.0.1:8080");
    assert.equal(
      resolveApiProxyTarget("http://user:pass@127.0.0.1:8080"),
      "http://127.0.0.1:8080",
    );
    assert.equal(resolveApiProxyTarget("javascript:alert(1)"), "http://127.0.0.1:8080");
  });
});

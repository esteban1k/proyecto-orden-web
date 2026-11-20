import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { appCsp } from "./csp.ts";

function connectSrc(policy) {
  return policy.split("; ").find((part) => part.startsWith("connect-src ")) ?? "";
}

describe("app CSP", () => {
  it("blocks objects and eval, and allows Next inline bootstrap", () => {
    const policy = appCsp("");
    assert.match(policy, /object-src 'none'/);
    assert.match(policy, /script-src 'self' 'unsafe-inline'/);
    assert.equal(policy.includes("unsafe-eval"), false);
    assert.match(connectSrc(policy), / https:$/);
  });

  it("pins connect-src to the configured API origin", () => {
    const connect = connectSrc(appCsp("https://api.listacriolla.app/v1"));
    const sources = connect.slice("connect-src ".length).split(" ");
    assert.equal(sources.includes("https://api.listacriolla.app"), true);
    assert.equal(sources.includes("https:"), false);
    assert.equal(connectSrc(appCsp("javascript:alert(1)")).includes("javascript"), false);
    assert.equal(connectSrc(appCsp("http://169.254.169.254")).includes("169.254.169.254"), false);
  });
});

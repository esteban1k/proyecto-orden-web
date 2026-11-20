import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAllowedGoogleRedirect } from "./urlSafety.ts";

describe("oauth redirect", () => {
  it("allows Google OAuth URLs only", () => {
    assert.equal(
      isAllowedGoogleRedirect(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id=abc",
      ),
      true,
    );
    assert.equal(
      isAllowedGoogleRedirect("https://accounts.google.com/o/oauth2/auth"),
      true,
    );
  });

  it("rejects open redirects and script URLs", () => {
    assert.equal(isAllowedGoogleRedirect("javascript:alert(1)"), false);
    assert.equal(isAllowedGoogleRedirect("https://evil.example/o/oauth2/auth"), false);
    assert.equal(
      isAllowedGoogleRedirect("https://accounts.google.com.evil.example/o/oauth2/auth"),
      false,
    );
    assert.equal(
      isAllowedGoogleRedirect("https://user:pass@accounts.google.com/o/oauth2/auth"),
      false,
    );
    assert.equal(isAllowedGoogleRedirect("http://accounts.google.com/o/oauth2/auth"), false);
    assert.equal(isAllowedGoogleRedirect("https://accounts.google.com/"), false);
  });
});

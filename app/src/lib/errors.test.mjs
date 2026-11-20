import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ApiError } from "./api/client.ts";
import { userFacingError } from "./errors.ts";

describe("user facing errors", () => {
  it("maps known codes and never echoes arbitrary server text", () => {
    assert.match(userFacingError(new ApiError(401, "invalid_credentials")), /incorrectos/);
    const leaked = "<img src=x onerror=alert(1)>";
    const text = userFacingError(new ApiError(500, "not_mapped"));
    assert.equal(text.includes(leaked), false);
    assert.equal(text, "Algo salió mal. Intentá de nuevo.");
    assert.equal(userFacingError(new Error(leaked)).includes("onerror"), false);
  });
});

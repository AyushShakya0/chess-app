import test from "node:test";
import assert from "node:assert";
import { validatePromoCode } from "../lib/promo.ts";

test("VIP Entitlement Engine - server-side promo redemption rules", () => {
  // 1. Secret lifetime VIP code
  const result = validatePromoCode("chess");
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.plan, "VIP_LIFETIME");

  // 2. Case and whitespace insensitivity
  assert.strictEqual(validatePromoCode("  CHESS  ").valid, true);
  assert.strictEqual(validatePromoCode("cHeSs").valid, true);

  // 3. Rejects invalid codes cleanly
  const invalid = validatePromoCode("grandmaster");
  assert.strictEqual(invalid.valid, false);
  assert.strictEqual(invalid.plan, "NONE");
  assert.strictEqual(invalid.message, "Invalid promo code.");

  // 4. Rejects empty input
  assert.strictEqual(validatePromoCode("").valid, false);
  assert.strictEqual(validatePromoCode("   ").valid, false);
});

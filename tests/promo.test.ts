import test from "node:test";
import assert from "node:assert";
import { validatePromoCode } from "../lib/promo.ts";

test("Promo Code Engine - validate secret 'chess' VIP code from app code", () => {
  const validRes = validatePromoCode("chess");
  assert.strictEqual(validRes.valid, true);
  assert.strictEqual(validRes.plan, "VIP_LIFETIME");

  assert.strictEqual(validatePromoCode(" CHESS ").valid, true);
  assert.strictEqual(validatePromoCode("Chess").valid, true);

  assert.strictEqual(validatePromoCode("invalid").valid, false);
  assert.strictEqual(validatePromoCode("").valid, false);
});

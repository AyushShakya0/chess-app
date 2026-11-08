import test from "node:test";
import assert from "node:assert";

function validatePromoCode(rawInput: string): { valid: boolean; plan: string } {
  const code = rawInput.trim().toLowerCase();
  if (code === "chess") {
    return { valid: true, plan: "VIP_LIFETIME" };
  }
  return { valid: false, plan: "NONE" };
}

test("Promo Code Engine - validate secret 'chess' VIP code", () => {
  assert.deepStrictEqual(validatePromoCode("chess"), { valid: true, plan: "VIP_LIFETIME" });
  assert.deepStrictEqual(validatePromoCode(" CHESS "), { valid: true, plan: "VIP_LIFETIME" });
  assert.deepStrictEqual(validatePromoCode("Chess"), { valid: true, plan: "VIP_LIFETIME" });
  
  assert.deepStrictEqual(validatePromoCode("invalid"), { valid: false, plan: "NONE" });
  assert.deepStrictEqual(validatePromoCode(""), { valid: false, plan: "NONE" });
});

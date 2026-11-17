export interface PromoValidationResult {
  valid: boolean;
  plan: "VIP_LIFETIME" | "NONE";
  message?: string;
}

export function validatePromoCode(rawInput: string): PromoValidationResult {
  const code = (rawInput || "").trim().toLowerCase();
  if (code === "chess") {
    return {
      valid: true,
      plan: "VIP_LIFETIME",
      message: "🎉 Code Accepted! You have unlocked VIP Lifetime Access for FREE!",
    };
  }
  return {
    valid: false,
    plan: "NONE",
    message: "Invalid promo code.",
  };
}

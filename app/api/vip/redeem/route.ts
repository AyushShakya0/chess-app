import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";
import { validatePromoCode } from "@/lib/promo";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`vip-redeem:${ip}`, 10, 60 * 1000);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many redemption attempts. Please wait 1 minute." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const code = typeof body.code === "string" ? body.code : "";

    const result = validatePromoCode(code);

    if (!result.valid) {
      return NextResponse.json(
        {
          valid: false,
          isVip: false,
          plan: "NONE",
          message: "Invalid promo code. Please check and try again.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        isVip: true,
        plan: result.plan,
        message: result.message,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Malformed request payload" }, { status: 400 });
  }
}

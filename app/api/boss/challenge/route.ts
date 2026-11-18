import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp, escapeHtml } from "@/lib/security/rate-limiter";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(ip, 10, 60 * 1000); // 10 challenges / min
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Please wait a minute before sending another challenge." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const rawName = typeof body.challengerName === "string" ? body.challengerName.trim() : "";
    const rawElo = Number(body.challengerElo);
    const rawMessage = typeof body.message === "string" ? body.message.trim() : "";

    // Input validation
    if (!rawName || rawName.length > 50) {
      return NextResponse.json(
        { success: false, error: "Invalid challenger name (must be 1-50 characters)" },
        { status: 400 }
      );
    }

    const challengerElo = Number.isFinite(rawElo) && rawElo >= 100 && rawElo <= 4000 ? Math.round(rawElo) : 1500;
    const message = rawMessage.slice(0, 300);

    // Escape HTML to prevent attribute injection and HTML injection in emails
    const safeName = escapeHtml(rawName);
    const safeMessage = escapeHtml(message || "Are you ready to face me?");

    // Target email from env or verified owner address
    const targetEmail = process.env.BOSS_ALERT_EMAIL || "shakyaayush82@gmail.com";

    // Server-authoritative UUID room ID (cannot be steered by client)
    const roomId = crypto.randomUUID();
    const appUrl = (process.env.APP_URL || req.nextUrl.origin).replace(/\/$/, "");
    const inviteLink = `${appUrl}/play/${roomId}`;

    // Mailto fallback
    const emailSubject = encodeURIComponent(`⚔️ BOSS CHALLENGE: ${rawName} (${challengerElo} ELO) has challenged you!`);
    const emailBody = encodeURIComponent(
      `👑 Boss Arena Challenge Alert\n\n` +
      `${rawName} (${challengerElo} ELO) has issued an official Grandmaster Boss Challenge to you!\n\n` +
      `War Cry: "${message || "Are you ready to face me?"}"\n\n` +
      `Accept Challenge & Enter Arena: ${inviteLink}\n`
    );
    const mailtoLink = `mailto:${targetEmail}?subject=${emailSubject}&body=${emailBody}`;

    let emailDelivered = false;
    let deliveryNote = "Direct email requires RESEND_API_KEY in .env.local; direct mailto fallback provided.";

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Sovereign Chess Boss Arena <onboarding@resend.dev>",
            to: targetEmail,
            subject: `⚔️ BOSS CHALLENGE: ${rawName} (${challengerElo} ELO) has challenged you!`,
            html: `
              <h2>👑 Boss Arena Challenge Alert</h2>
              <p><strong>${safeName}</strong> (${challengerElo} ELO) has issued an official Grandmaster Boss Challenge to you!</p>
              <p><em>"${safeMessage}"</em></p>
              <p><a href="${encodeURI(inviteLink)}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Accept Challenge & Enter Arena</a></p>
            `,
          }),
        });

        if (resendRes.ok) {
          emailDelivered = true;
          deliveryNote = `Direct automated email successfully dispatched to ${targetEmail} via Resend.`;
        } else {
          deliveryNote = `Resend returned status ${resendRes.status}. Use mailto fallback.`;
        }
      } catch {
        deliveryNote = "Resend request failed. Use mailto fallback.";
      }
    }

    return NextResponse.json({
      success: true,
      emailDelivered,
      deliveryNote,
      emailSentTo: targetEmail,
      roomId,
      inviteLink,
      mailtoLink,
      message: emailDelivered
        ? `Challenge dispatched to Ayush at ${targetEmail}!`
        : `Challenge match room created! Click 'Send Email to Ayush' to notify him directly.`,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to dispatch boss challenge" },
      { status: 500 }
    );
  }
}

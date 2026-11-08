import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { challengerName, challengerElo, roomId, message } = await req.json();

    const targetEmail = "shakyaayush82@gmail.com";
    const inviteLink = `${req.nextUrl.origin}/play/${roomId}`;

    // Log the boss challenge event
    console.log(`[BOSS MODE CHALLENGE] Challenger: ${challengerName} (${challengerElo} ELO) has challenged Ayush Shakya!`);
    console.log(`[BOSS MODE LINK] ${inviteLink}`);
    console.log(`[BOSS MODE MESSAGE] ${message || "No message provided"}`);

    // Generate direct mailto link as reliable zero-config fallback
    const emailSubject = encodeURIComponent(`⚔️ BOSS CHALLENGE: ${challengerName} (${challengerElo} ELO) has challenged you!`);
    const emailBody = encodeURIComponent(
      `👑 Boss Arena Challenge Alert\n\n` +
      `${challengerName} (${challengerElo} ELO) has issued an official Grandmaster Boss Challenge to you!\n\n` +
      `War Cry: "${message || "Are you ready to face me?"}"\n\n` +
      `Accept Challenge & Enter Arena: ${inviteLink}\n`
    );
    const mailtoLink = `mailto:${targetEmail}?subject=${emailSubject}&body=${emailBody}`;

    let emailDelivered = false;
    let deliveryNote = "Direct email requires RESEND_API_KEY in .env.local; direct mailto fallback provided.";

    // If RESEND_API_KEY is configured, dispatch the real-time email
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
            from: "Prin Chess Boss Arena <onboarding@resend.dev>",
            to: targetEmail,
            subject: `⚔️ BOSS CHALLENGE: ${challengerName} (${challengerElo} ELO) has challenged you!`,
            html: `
              <h2>👑 Boss Arena Challenge Alert</h2>
              <p><strong>${challengerName}</strong> (${challengerElo} ELO) has issued an official Grandmaster Boss Challenge to you!</p>
              <p><em>"${message || "Are you ready to face me?"}"</em></p>
              <p><a href="${inviteLink}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Accept Challenge & Enter Arena</a></p>
            `,
          }),
        });

        if (resendRes.ok) {
          emailDelivered = true;
          deliveryNote = `Direct automated email successfully dispatched to ${targetEmail} via Resend.`;
        } else {
          deliveryNote = `Resend returned status ${resendRes.status}. Use mailto fallback.`;
        }
      } catch (e) {
        deliveryNote = "Resend request failed. Use mailto fallback.";
      }
    }

    return NextResponse.json({
      success: true,
      emailDelivered,
      deliveryNote,
      emailSentTo: targetEmail,
      inviteLink,
      mailtoLink,
      message: emailDelivered
        ? `Challenge dispatched to Ayush at ${targetEmail}!`
        : `Challenge match room created! Click 'Send Email to Ayush' to notify him directly.`,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to dispatch boss challenge",
    }, { status: 500 });
  }
}


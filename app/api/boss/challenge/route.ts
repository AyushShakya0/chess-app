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

    // If RESEND_API_KEY is configured, dispatch the real-time email
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Chess Boss Arena <boss@chessapp.dev>",
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
    }

    return NextResponse.json({
      success: true,
      emailSentTo: targetEmail,
      inviteLink,
      message: `Challenge dispatched to Ayush at ${targetEmail}!`,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to dispatch boss challenge",
    }, { status: 500 });
  }
}

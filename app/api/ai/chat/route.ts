import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// In-memory simple rate-limiting cache
let lastCallTimestamp = 0;
const RATE_LIMIT_COOLDOWN_MS = 10000; // 10s cooldown to respect free quota

export async function POST(req: NextRequest) {
  try {
    const { botName, event, pgn, lastMove } = await req.json();

    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY;

    // If no key or throttled, signal client to use rich fallback
    const now = Date.now();
    if (!apiKey || now - lastCallTimestamp < RATE_LIMIT_COOLDOWN_MS) {
      return NextResponse.json({
        fallback: true,
        reason: !apiKey ? "missing_key" : "rate_limited",
      });
    }

    lastCallTimestamp = now;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 50,
        temperature: 0.8,
      },
    });

    const systemPrompt = `You are an AI chess bot named "${botName}" playing an online chess match against a human. 
Current game event: ${event || "normal move"}.
Last move played: ${lastMove || "e4"}.
Recent PGN summary: ${pgn || "1. e4"}.

Respond with ONE short, funny, in-character sentence (under 18 words) reacting to this position. Trash-talk or banter in character. Do NOT break character.`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text().trim().replace(/^["']|["']$/g, "");

    return NextResponse.json({
      text: responseText,
      fallback: false,
    });
  } catch {
    // Graceful fallback on any Gemini API error or 429
    return NextResponse.json({
      fallback: true,
      reason: "api_error",
    });
  }
}


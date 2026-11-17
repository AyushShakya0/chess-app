import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";

// Module-level tracking for key cool-offs (e.g. 429 quota exhausted)
const keyCoolOffs = new Map<string, number>();

// Allowed bot personas to prevent prompt injection hijacking
const ALLOWED_BOT_NAMES = new Set([
  "Martin",
  "Nelson",
  "GothamChess",
  "Hikaru Nakamura",
  "Magnus Carlsen",
  "Ayush Shakya",
  "Ayush (GM Boss)",
  "Bot",
]);

// Known working models in order of speed and availability
const PREFERRED_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

function getApiKeys(): string[] {
  const pool: string[] = [];

  const addKey = (k?: string) => {
    if (!k) return;
    const clean = k.trim();
    if (clean && !clean.includes("your_") && !pool.includes(clean)) {
      pool.push(clean);
    }
  };

  // 1. Check comma-separated GEMINI_API_KEYS
  if (process.env.GEMINI_API_KEYS) {
    process.env.GEMINI_API_KEYS.split(",").forEach(addKey);
  }

  // 2. Check primary, backup, and legacy studio environment variables
  addKey(process.env.GEMINI_API_KEY);
  addKey(process.env.GEMINI_API_KEY_BACKUP);
  addKey(process.env.GOOGLE_AI_STUDIO_API_KEY);

  return pool;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(ip, 25, 60 * 1000); // 25 chat calls / min
    if (!rateLimit.success) {
      return NextResponse.json({
        fallback: true,
        reason: "rate_limited",
      });
    }

    const body = await req.json();

    // 1. Validate & sanitize botName against allowlist
    const rawBotName = typeof body.botName === "string" ? body.botName.trim() : "";
    const botName = ALLOWED_BOT_NAMES.has(rawBotName) ? rawBotName : "GothamChess";

    // 2. Sanitize & cap field lengths
    const rawEvent = typeof body.event === "string" ? body.event.trim().slice(0, 60) : "normal move";
    const rawLastMove = typeof body.lastMove === "string" ? body.lastMove.trim().slice(0, 15) : "e4";
    const rawPgn = typeof body.pgn === "string" ? body.pgn.trim().slice(0, 120) : "";

    // Restrict lastMove to legal SAN characters only
    const cleanLastMove = /^[a-h1-8KQRBNx+#=O\-\/ ]+$/i.test(rawLastMove) ? rawLastMove : "e4";
    // Restrict pgn to legal SAN characters and move numbers
    const cleanPgn = /^[0-9a-hKQRBNx+#=O\-\. ]+$/i.test(rawPgn) ? rawPgn : "";

    const allKeys = getApiKeys();
    if (allKeys.length === 0) {
      return NextResponse.json({
        fallback: true,
        reason: "missing_key",
      });
    }

    const now = Date.now();
    // Sort keys: keys whose cooldown has expired come first
    const availableKeys = [...allKeys].sort((a, b) => {
      const coolA = keyCoolOffs.get(a) || 0;
      const coolB = keyCoolOffs.get(b) || 0;
      const aAvailable = coolA < now ? 0 : 1;
      const bAvailable = coolB < now ? 0 : 1;
      return aAvailable - bAvailable;
    });

    const systemPrompt = `You are an AI chess bot named "${botName}" playing an online chess match against a human.
Current game event: ${rawEvent}.
Last move played: ${cleanLastMove}.
Recent moves: ${cleanPgn || cleanLastMove}.

Respond with ONE short, witty, in-character sentence (under 18 words) reacting to this position. Trash-talk or banter in character. Do NOT break character.`;

    let generatedText: string | null = null;

    for (let i = 0; i < availableKeys.length; i++) {
      const currentKey = availableKeys[i];
      const coolOffExpiry = keyCoolOffs.get(currentKey) || 0;

      if (coolOffExpiry > now && i < availableKeys.length - 1) {
        continue;
      }

      for (const modelName of PREFERRED_MODELS) {
        try {
          const genAI = new GoogleGenerativeAI(currentKey);
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              maxOutputTokens: 50,
              temperature: 0.85,
            },
          });

          // Timeout with 4-second race
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 4000)
          );

          const result = await Promise.race([
            model.generateContent(systemPrompt),
            timeoutPromise,
          ]);

          const raw = result.response.text();
          if (raw) {
            generatedText = raw.trim().replace(/^["']|["']$/g, "");
            keyCoolOffs.delete(currentKey);
            break;
          }
        } catch (err: unknown) {
          const errMsg = (err instanceof Error ? err.message : String(err)).toLowerCase();
          const isQuota =
            errMsg.includes("429") ||
            errMsg.includes("quota") ||
            errMsg.includes("resource_exhausted") ||
            errMsg.includes("rate");

          if (isQuota) {
            keyCoolOffs.set(currentKey, now + 60_000);
            break;
          } else if (errMsg.includes("404") || errMsg.includes("not found")) {
            continue;
          } else {
            break;
          }
        }
      }

      if (generatedText) {
        break;
      }
    }

    if (generatedText) {
      return NextResponse.json({
        text: generatedText,
        fallback: false,
      });
    }

    return NextResponse.json({
      fallback: true,
      reason: "all_keys_exhausted",
    });
  } catch {
    return NextResponse.json({
      fallback: true,
      reason: "api_error",
    });
  }
}

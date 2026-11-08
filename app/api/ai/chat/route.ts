import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Module-level tracking for key cool-offs (e.g. 429 quota exhausted)
const keyCoolOffs = new Map<string, number>();

// In-memory request debounce to prevent excessive spamming (2s)
let lastCallTimestamp = 0;
const GLOBAL_COOLDOWN_MS = 2000;

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
    const { botName, event, pgn, lastMove } = await req.json();

    const now = Date.now();
    if (now - lastCallTimestamp < GLOBAL_COOLDOWN_MS) {
      return NextResponse.json({
        fallback: true,
        reason: "rate_limited",
      });
    }

    const allKeys = getApiKeys();
    if (allKeys.length === 0) {
      return NextResponse.json({
        fallback: true,
        reason: "missing_key",
      });
    }

    // Sort keys: keys whose cooldown has expired or are not cooled down come first
    const availableKeys = [...allKeys].sort((a, b) => {
      const coolA = keyCoolOffs.get(a) || 0;
      const coolB = keyCoolOffs.get(b) || 0;
      const aAvailable = coolA < now ? 0 : 1;
      const bAvailable = coolB < now ? 0 : 1;
      return aAvailable - bAvailable;
    });

    const systemPrompt = `You are an AI chess bot named "${botName || "GothamChess"}" playing an online chess match against a human.
Current game event: ${event || "normal move"}.
Last move played: ${lastMove || "e4"}.
Recent moves: ${pgn || "1. e4"}.

Respond with ONE short, witty, in-character sentence (under 18 words) reacting to this position. Trash-talk or banter in character. Do NOT break character.`;

    let generatedText: string | null = null;
    let keyUsedIndex = -1;

    for (let i = 0; i < availableKeys.length; i++) {
      const currentKey = availableKeys[i];
      const coolOffExpiry = keyCoolOffs.get(currentKey) || 0;

      // If key is still cooling off and we have other fresh keys, skip it
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

          const result = await model.generateContent(systemPrompt);
          const raw = result.response.text();
          if (raw) {
            generatedText = raw.trim().replace(/^["']|["']$/g, "");
            keyUsedIndex = i;
            // Clear any previous cool-off on success
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
            // Set 60-second cool-off for this exhausted key
            keyCoolOffs.set(currentKey, now + 60_000);
            console.warn(`[Gemini Failover] Key #${i + 1} quota hit, cooling down 60s. Trying next backup key...`);
            break; // Break inner model loop to switch key immediately
          } else if (errMsg.includes("404") || errMsg.includes("not found")) {
            // Model not found on this version, continue to next model in PREFERRED_MODELS
            continue;
          } else {
            console.warn(`[Gemini Failover] Key #${i + 1} (${modelName}) error: ${errMsg}`);
            break;
          }
        }
      }

      if (generatedText) {
        break;
      }
    }

    if (generatedText) {
      lastCallTimestamp = Date.now();
      return NextResponse.json({
        text: generatedText,
        fallback: false,
        keyIndex: keyUsedIndex,
      });
    }

    // All keys exhausted or errored: signal client to use rich character fallback
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

// Vercel edge function — natural-language food logging powered by Claude.
//
// Set ANTHROPIC_API_KEY in Vercel env vars. Uses prompt caching so the bulky
// system prompt (food database + instructions) only costs full price on the
// first message of each session.

// Imported from src/lib — bundled by Vercel
// (eslint-disable-next-line for cross-directory import)
// @ts-ignore — api/ isn't in tsconfig.app.json's include but Vercel resolves it
import { LOCAL_FOODS } from "../src/lib/foodDatabase";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface CustomFoodLite {
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

interface RequestBody {
  messages: ChatMessage[];
  customFoods?: CustomFoodLite[];
}

const BASE_SYSTEM_PROMPT = `You are a nutrition logging assistant for a fitness tracker app. The user describes food they ate in natural language, often using Indian portion terms (bowl, roti, katori, plate). Your job:

1. Parse each food item the user mentions.
2. Match items to the foods database below where possible. If an item isn't in the database, use accurate general nutrition knowledge (USDA-equivalent values).
3. Convert quantities to grams. Common portion conversions:
   - 1 roti/chapati ≈ 40g, 1 naan ≈ 90g, 1 paratha ≈ 80g
   - 1 small bowl rice/dal ≈ 150g, 1 cup rice ≈ 150g
   - 1 egg ≈ 50g, 1 cup milk ≈ 240ml ≈ 240g
   - 1 tsp ≈ 5g, 1 tbsp ≈ 15g
   - 1 piece of wonton wrapper ≈ 7g
4. Compute calories, protein (g), carbs (g), fat (g) for each item at the actual quantity (NOT per 100g — at the eaten amount).
5. If something is critically ambiguous (e.g. "a bunch of grapes" — could be 50g or 500g), ask ONE clarifying question instead of guessing.
6. Otherwise, make a reasonable estimate and log it.

Respond ONLY with a single JSON object — no markdown fences, no commentary outside the JSON. Use this exact shape:

{
  "message": "Short friendly summary (1-2 sentences)",
  "items": [
    {
      "food_name": "Display name (you can customize, e.g. 'Chicken Breast 200g')",
      "quantity": 200,
      "unit": "g",
      "calories": 330,
      "protein_g": 62,
      "carbs_g": 0,
      "fat_g": 7.2
    }
  ],
  "needs_clarification": false,
  "clarification_question": null
}

If clarification is needed: set "items" to [], "needs_clarification" to true, and put your question in "clarification_question". Keep questions brief.

CURATED FOODS DATABASE (per 100g):
${LOCAL_FOODS.map(
  (f) =>
    `${f.product_name}: ${f.calories_per_100g}kcal P${f.protein_per_100g}g C${f.carbs_per_100g}g F${f.fat_per_100g}g`,
).join("\n")}`;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey =
    (globalThis as unknown as { process?: { env?: Record<string, string> } })
      .process?.env?.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "ANTHROPIC_API_KEY not configured on the server. Add it to Vercel env vars.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, customFoods } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Append the user's custom foods to the system prompt
  const customFoodsText =
    customFoods && customFoods.length > 0
      ? `\n\nUSER'S CUSTOM FOODS (per 100g):\n${customFoods
          .map(
            (cf) =>
              `${cf.name}: ${cf.calories_per_100g}kcal P${cf.protein_per_100g}g C${cf.carbs_per_100g}g F${cf.fat_per_100g}g`,
          )
          .join("\n")}`
      : "";

  const fullSystemPrompt = BASE_SYSTEM_PROMPT + customFoodsText;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
        system: [
          {
            type: "text",
            text: fullSystemPrompt,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({
          error: `Claude API error (${response.status}): ${errText.slice(0, 300)}`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const text: string = data?.content?.[0]?.text ?? "{}";

    // Parse Claude's JSON output. Strip code fences if present.
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return new Response(
          JSON.stringify({
            error: "Could not parse AI response",
            raw: text.slice(0, 500),
          }),
          { status: 502, headers: { "Content-Type": "application/json" } },
        );
      }
      parsed = JSON.parse(match[0]);
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

export const config = { runtime: "edge" };

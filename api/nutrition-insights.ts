// Vercel edge function — Claude as nutrition coach analyzing a food-log
// window. The frontend computes totals + top foods and sends them so the
// model has grounded numbers to reason from. Conversation history is
// passed through so users can ask follow-ups.

interface FoodEntry {
  name: string;
  total: number;
  entries: number;
}

interface RequestBody {
  period: { from: string; to: string; days: number; daysLogged: number };
  goals: { calories: number; protein: number; carbs: number; fat: number };
  totals: { calories: number; protein: number; carbs: number; fat: number };
  topFoods: {
    by_carbs: FoodEntry[];
    by_fat: FoodEntry[];
    by_protein: FoodEntry[];
    by_calories: FoodEntry[];
  };
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

const BASE_INSTRUCTIONS = `You are a nutrition coach for a fitness tracker app. The user logs Indian food often — bowls of dal, rotis, biryani, paneer, etc. Be specific, honest, and encouraging.

For any analysis, always cover:
1. Which macros were met, exceeded, or missed (always cite actual numbers and % vs goal).
2. The top 1–2 foods that drove the result (use the TOP FOODS data below — never guess).
3. Concrete suggestions: what specific foods to eat MORE of next few days, what to eat LESS of, to better hit goals.
4. Keep it under ~200 words for first analysis; under 100 for follow-ups.

Format: plain text with light markdown (**bold** for numbers/food names, "-" bullets for lists). No JSON, no code blocks. Speak directly to the user ("you ate", "try adding").`;

function fmtPct(actual: number, target: number): string {
  if (target <= 0) return "no target";
  const diff = actual - target;
  const pct = Math.abs((diff / target) * 100);
  if (pct < 5) return "on target";
  if (diff > 0) return `${pct.toFixed(0)}% over`;
  return `${pct.toFixed(0)}% under`;
}

function fmtTopFoods(items: FoodEntry[], macroLabel: string): string {
  if (!items || items.length === 0) return "  (none)";
  return items
    .slice(0, 4)
    .map(
      (f, i) =>
        `  ${i + 1}. ${f.name} — ${Math.round(f.total)}${macroLabel} across ${f.entries} entr${f.entries === 1 ? "y" : "ies"}`,
    )
    .join("\n");
}

function buildContext(req: RequestBody): string {
  const { period, goals, totals, topFoods } = req;
  const targets = {
    calories: goals.calories * period.days,
    protein: goals.protein * period.days,
    carbs: goals.carbs * period.days,
    fat: goals.fat * period.days,
  };

  return `${BASE_INSTRUCTIONS}

==============================
USER'S NUTRITION DATA
==============================

PERIOD: ${period.from} → ${period.to} (${period.days} days; logged on ${period.daysLogged}).

DAILY GOALS:
- Calories: ${goals.calories} kcal
- Protein: ${goals.protein} g
- Carbs: ${goals.carbs} g
- Fat: ${goals.fat} g

PERIOD TOTALS vs TARGETS:
- Calories: ${Math.round(totals.calories).toLocaleString()} / ${Math.round(targets.calories).toLocaleString()} kcal — ${fmtPct(totals.calories, targets.calories)}
- Protein: ${Math.round(totals.protein)} / ${Math.round(targets.protein)} g — ${fmtPct(totals.protein, targets.protein)}
- Carbs: ${Math.round(totals.carbs)} / ${Math.round(targets.carbs)} g — ${fmtPct(totals.carbs, targets.carbs)}
- Fat: ${Math.round(totals.fat)} / ${Math.round(targets.fat)} g — ${fmtPct(totals.fat, targets.fat)}

TOP CALORIE SOURCES:
${fmtTopFoods(topFoods.by_calories, " kcal")}

TOP CARB SOURCES:
${fmtTopFoods(topFoods.by_carbs, "g carbs")}

TOP FAT SOURCES:
${fmtTopFoods(topFoods.by_fat, "g fat")}

TOP PROTEIN SOURCES:
${fmtTopFoods(topFoods.by_protein, "g protein")}
`;
}

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

  if (
    !body.period ||
    !body.goals ||
    !body.totals ||
    !body.topFoods ||
    !Array.isArray(body.messages)
  ) {
    return new Response(JSON.stringify({ error: "Malformed request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const systemPrompt = buildContext(body);

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
        system: [{ type: "text", text: systemPrompt }],
        messages: body.messages,
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
    const text: string = data?.content?.[0]?.text ?? "";

    return new Response(JSON.stringify({ message: text }), {
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

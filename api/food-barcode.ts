// Vercel edge function — looks up a barcode against Open Food Facts.

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const barcode = url.searchParams.get("barcode") ?? "";

  // Open Food Facts uses 8–13 digit GTIN/EAN codes
  if (!/^\d{8,13}$/.test(barcode)) {
    return new Response(
      JSON.stringify({ error: "invalid barcode" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const apiUrl = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;

  try {
    const upstream = await fetch(apiUrl, {
      headers: { "User-Agent": "FitnessTracker/1.0 (fitness@example.com)" },
    });
    const data = await upstream.json();

    if (data.status !== 1 || !data.product) {
      return new Response(
        JSON.stringify({ found: false }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const p = data.product;
    const n = p.nutriments ?? {};
    const kcal = n["energy-kcal_100g"];

    if (typeof kcal !== "number") {
      return new Response(
        JSON.stringify({ found: false, reason: "no nutrition data" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        found: true,
        product: {
          product_name: (p.product_name || "Unknown product").trim(),
          calories_per_100g: kcal,
          protein_per_100g: n.proteins_100g ?? 0,
          carbs_per_100g: n.carbohydrates_100g ?? 0,
          fat_per_100g: n.fat_100g ?? 0,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "s-maxage=86400", // barcode data is stable
        },
      },
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "upstream request failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

export const config = { runtime: "edge" };

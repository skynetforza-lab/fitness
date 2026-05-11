import type { FoodSearchResult } from "./types";

export { searchLocalFoods } from "./foodDatabase";

interface RawProduct {
  product_name?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
}

interface RawResponse {
  products?: RawProduct[];
}

/**
 * Looks up a barcode against Open Food Facts.
 * Handles both our serverless-function response shape (prod)
 * and the raw OFF shape (dev proxy).
 */
export async function lookupBarcode(
  barcode: string,
): Promise<FoodSearchResult | null> {
  try {
    const res = await fetch(
      `/api/food-barcode?barcode=${encodeURIComponent(barcode)}`,
    );
    if (!res.ok) return null;
    const data = await res.json();

    // Production: our serverless function returns { found: true, product: {...} }
    if (data.found === true && data.product) {
      return data.product as FoodSearchResult;
    }

    // Dev proxy: raw OFF response { status: 1, product: { nutriments: {...} } }
    if (data.status === 1 && data.product) {
      const p = data.product;
      const n = p.nutriments ?? {};
      const kcal = n["energy-kcal_100g"];
      if (typeof kcal !== "number") return null;
      return {
        product_name: (p.product_name || "Unknown product").trim(),
        calories_per_100g: kcal,
        protein_per_100g: n.proteins_100g ?? 0,
        carbs_per_100g: n.carbohydrates_100g ?? 0,
        fat_per_100g: n.fat_100g ?? 0,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Searches Open Food Facts (branded/packaged products only).
 * Returns [] silently on failure — caller can rely on local DB for basics.
 */
export async function searchRemoteFoods(
  query: string,
): Promise<FoodSearchResult[]> {
  try {
    const res = await fetch(
      `/api/food-search?query=${encodeURIComponent(query)}`,
    );
    if (!res.ok) return [];
    const data = (await res.json()) as RawResponse;

    return (data.products ?? [])
      .filter((p) => {
        const n = p.nutriments;
        return (
          p.product_name?.trim() &&
          n != null &&
          typeof n["energy-kcal_100g"] === "number"
        );
      })
      .map((p) => ({
        product_name: p.product_name!.trim(),
        calories_per_100g: p.nutriments!["energy-kcal_100g"]!,
        protein_per_100g: p.nutriments!.proteins_100g ?? 0,
        carbs_per_100g: p.nutriments!.carbohydrates_100g ?? 0,
        fat_per_100g: p.nutriments!.fat_100g ?? 0,
      }))
      .slice(0, 15);
  } catch {
    return [];
  }
}

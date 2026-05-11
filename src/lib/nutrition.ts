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

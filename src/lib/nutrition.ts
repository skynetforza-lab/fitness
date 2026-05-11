import type { FoodSearchResult } from "./types";

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

export async function searchFood(query: string): Promise<FoodSearchResult[]> {
  const res = await fetch(`/api/food-search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Food search failed");
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
    }));
}

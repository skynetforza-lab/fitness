import type { FoodSearchResult } from "./types";

/**
 * Curated food database — instant search for common foods.
 * All values are per 100g.
 * Sources: USDA FoodData Central + standard Indian food nutrition tables.
 */
export const LOCAL_FOODS: FoodSearchResult[] = [
  // ---------- Eggs ----------
  { product_name: "Boiled Egg",          calories_per_100g: 155, protein_per_100g: 13,   carbs_per_100g: 1.1,  fat_per_100g: 11 },
  { product_name: "Scrambled Egg",       calories_per_100g: 149, protein_per_100g: 10,   carbs_per_100g: 1.6,  fat_per_100g: 11 },
  { product_name: "Fried Egg",           calories_per_100g: 196, protein_per_100g: 14,   carbs_per_100g: 0.8,  fat_per_100g: 15 },
  { product_name: "Omelette (plain)",    calories_per_100g: 154, protein_per_100g: 11,   carbs_per_100g: 0.6,  fat_per_100g: 12 },
  { product_name: "Omelette (vegetable)",calories_per_100g: 140, protein_per_100g: 10,   carbs_per_100g: 2.5,  fat_per_100g: 10 },
  { product_name: "Egg White (cooked)",  calories_per_100g: 52,  protein_per_100g: 11,   carbs_per_100g: 0.7,  fat_per_100g: 0.2 },

  // ---------- Indian Breads ----------
  { product_name: "Roti / Chapati",      calories_per_100g: 297, protein_per_100g: 11,   carbs_per_100g: 56,   fat_per_100g: 4.6 },
  { product_name: "Naan",                calories_per_100g: 310, protein_per_100g: 9,    carbs_per_100g: 56,   fat_per_100g: 6 },
  { product_name: "Paratha (plain)",     calories_per_100g: 326, protein_per_100g: 8,    carbs_per_100g: 50,   fat_per_100g: 11 },
  { product_name: "Aloo Paratha",        calories_per_100g: 290, protein_per_100g: 6,    carbs_per_100g: 45,   fat_per_100g: 10 },
  { product_name: "Paneer Paratha",      calories_per_100g: 340, protein_per_100g: 11,   carbs_per_100g: 42,   fat_per_100g: 14 },
  { product_name: "Puri",                calories_per_100g: 419, protein_per_100g: 7,    carbs_per_100g: 53,   fat_per_100g: 21 },
  { product_name: "Bhatura",             calories_per_100g: 358, protein_per_100g: 8,    carbs_per_100g: 52,   fat_per_100g: 13 },

  // ---------- Rice & Biryani ----------
  { product_name: "White Rice (cooked)", calories_per_100g: 130, protein_per_100g: 2.7,  carbs_per_100g: 28,   fat_per_100g: 0.3 },
  { product_name: "Basmati Rice (cooked)",calories_per_100g: 121,protein_per_100g: 3,    carbs_per_100g: 25,   fat_per_100g: 0.4 },
  { product_name: "Brown Rice (cooked)", calories_per_100g: 112, protein_per_100g: 2.6,  carbs_per_100g: 23,   fat_per_100g: 0.9 },
  { product_name: "Jeera Rice",          calories_per_100g: 154, protein_per_100g: 3,    carbs_per_100g: 28,   fat_per_100g: 3 },
  { product_name: "Vegetable Biryani",   calories_per_100g: 145, protein_per_100g: 4,    carbs_per_100g: 23,   fat_per_100g: 4.5 },
  { product_name: "Chicken Biryani",     calories_per_100g: 200, protein_per_100g: 9,    carbs_per_100g: 26,   fat_per_100g: 7 },
  { product_name: "Mutton Biryani",      calories_per_100g: 235, protein_per_100g: 11,   carbs_per_100g: 25,   fat_per_100g: 10 },

  // ---------- Dal & Legumes ----------
  { product_name: "Dal Tadka",           calories_per_100g: 116, protein_per_100g: 7,    carbs_per_100g: 17,   fat_per_100g: 3 },
  { product_name: "Moong Dal (cooked)",  calories_per_100g: 105, protein_per_100g: 7,    carbs_per_100g: 19,   fat_per_100g: 0.5 },
  { product_name: "Masoor Dal",          calories_per_100g: 116, protein_per_100g: 9,    carbs_per_100g: 20,   fat_per_100g: 0.4 },
  { product_name: "Chana / Chole",       calories_per_100g: 164, protein_per_100g: 7,    carbs_per_100g: 27,   fat_per_100g: 3 },
  { product_name: "Rajma (kidney beans)",calories_per_100g: 127, protein_per_100g: 9,    carbs_per_100g: 23,   fat_per_100g: 0.5 },
  { product_name: "Black Dal (urad)",    calories_per_100g: 145, protein_per_100g: 8,    carbs_per_100g: 18,   fat_per_100g: 5 },

  // ---------- Indian Veg Dishes ----------
  { product_name: "Paneer",              calories_per_100g: 265, protein_per_100g: 18,   carbs_per_100g: 3.4,  fat_per_100g: 20 },
  { product_name: "Palak Paneer",        calories_per_100g: 180, protein_per_100g: 9,    carbs_per_100g: 6,    fat_per_100g: 13 },
  { product_name: "Paneer Tikka",        calories_per_100g: 215, protein_per_100g: 16,   carbs_per_100g: 5,    fat_per_100g: 15 },
  { product_name: "Aloo Gobi",           calories_per_100g: 95,  protein_per_100g: 3,    carbs_per_100g: 12,   fat_per_100g: 4 },
  { product_name: "Bhindi Masala",       calories_per_100g: 110, protein_per_100g: 3,    carbs_per_100g: 10,   fat_per_100g: 7 },
  { product_name: "Mixed Vegetable Curry",calories_per_100g: 95, protein_per_100g: 3,    carbs_per_100g: 11,   fat_per_100g: 4.5 },
  { product_name: "Baingan Bharta",      calories_per_100g: 90,  protein_per_100g: 2,    carbs_per_100g: 9,    fat_per_100g: 5 },
  { product_name: "Kadai Paneer",        calories_per_100g: 220, protein_per_100g: 13,   carbs_per_100g: 8,    fat_per_100g: 15 },
  { product_name: "Malai Kofta",         calories_per_100g: 240, protein_per_100g: 9,    carbs_per_100g: 14,   fat_per_100g: 17 },

  // ---------- Indian Non-Veg ----------
  { product_name: "Chicken Curry",       calories_per_100g: 175, protein_per_100g: 14,   carbs_per_100g: 5,    fat_per_100g: 11 },
  { product_name: "Butter Chicken",      calories_per_100g: 230, protein_per_100g: 14,   carbs_per_100g: 7,    fat_per_100g: 16 },
  { product_name: "Tandoori Chicken",    calories_per_100g: 170, protein_per_100g: 25,   carbs_per_100g: 3,    fat_per_100g: 6 },
  { product_name: "Chicken Tikka",       calories_per_100g: 180, protein_per_100g: 24,   carbs_per_100g: 3,    fat_per_100g: 8 },
  { product_name: "Mutton Curry",        calories_per_100g: 245, protein_per_100g: 17,   carbs_per_100g: 4,    fat_per_100g: 17 },
  { product_name: "Fish Curry",          calories_per_100g: 145, protein_per_100g: 13,   carbs_per_100g: 5,    fat_per_100g: 8 },
  { product_name: "Keema (minced meat)", calories_per_100g: 210, protein_per_100g: 16,   carbs_per_100g: 3,    fat_per_100g: 15 },

  // ---------- South Indian ----------
  { product_name: "Idli",                calories_per_100g: 156, protein_per_100g: 4,    carbs_per_100g: 31,   fat_per_100g: 0.3 },
  { product_name: "Dosa (plain)",        calories_per_100g: 168, protein_per_100g: 4,    carbs_per_100g: 28,   fat_per_100g: 4 },
  { product_name: "Masala Dosa",         calories_per_100g: 195, protein_per_100g: 5,    carbs_per_100g: 30,   fat_per_100g: 6 },
  { product_name: "Upma",                calories_per_100g: 132, protein_per_100g: 3,    carbs_per_100g: 23,   fat_per_100g: 3 },
  { product_name: "Poha",                calories_per_100g: 110, protein_per_100g: 2,    carbs_per_100g: 20,   fat_per_100g: 2.5 },
  { product_name: "Medu Vada",           calories_per_100g: 230, protein_per_100g: 8,    carbs_per_100g: 25,   fat_per_100g: 11 },
  { product_name: "Sambar",              calories_per_100g: 64,  protein_per_100g: 3,    carbs_per_100g: 8,    fat_per_100g: 2 },
  { product_name: "Rasam",               calories_per_100g: 24,  protein_per_100g: 1,    carbs_per_100g: 5,    fat_per_100g: 0.5 },
  { product_name: "Uttapam",             calories_per_100g: 160, protein_per_100g: 4,    carbs_per_100g: 27,   fat_per_100g: 4 },

  // ---------- Dairy ----------
  { product_name: "Curd / Plain Yogurt", calories_per_100g: 61,  protein_per_100g: 3.5,  carbs_per_100g: 4.7,  fat_per_100g: 3.3 },
  { product_name: "Greek Yogurt",        calories_per_100g: 97,  protein_per_100g: 9,    carbs_per_100g: 3.9,  fat_per_100g: 5 },
  { product_name: "Whole Milk",          calories_per_100g: 61,  protein_per_100g: 3.2,  carbs_per_100g: 4.8,  fat_per_100g: 3.3 },
  { product_name: "Skim Milk",           calories_per_100g: 34,  protein_per_100g: 3.4,  carbs_per_100g: 5,    fat_per_100g: 0.1 },
  { product_name: "Toned Milk (Amul)",   calories_per_100g: 58,  protein_per_100g: 3.1,  carbs_per_100g: 4.7,  fat_per_100g: 3 },
  { product_name: "Ghee",                calories_per_100g: 902, protein_per_100g: 0,    carbs_per_100g: 0,    fat_per_100g: 100 },
  { product_name: "Butter",              calories_per_100g: 717, protein_per_100g: 0.9,  carbs_per_100g: 0.1,  fat_per_100g: 81 },
  { product_name: "Cheese (cheddar)",    calories_per_100g: 402, protein_per_100g: 25,   carbs_per_100g: 1.3,  fat_per_100g: 33 },
  { product_name: "Cottage Cheese",      calories_per_100g: 98,  protein_per_100g: 11,   carbs_per_100g: 3.4,  fat_per_100g: 4.3 },

  // ---------- Proteins (meat/fish) ----------
  { product_name: "Chicken Breast (grilled)", calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6 },
  { product_name: "Chicken Thigh (cooked)",   calories_per_100g: 209, protein_per_100g: 25, carbs_per_100g: 0, fat_per_100g: 11 },
  { product_name: "Salmon (cooked)",     calories_per_100g: 208, protein_per_100g: 22,   carbs_per_100g: 0,    fat_per_100g: 13 },
  { product_name: "Tuna (canned, water)",calories_per_100g: 132, protein_per_100g: 28,   carbs_per_100g: 0,    fat_per_100g: 1 },
  { product_name: "Tofu",                calories_per_100g: 76,  protein_per_100g: 8,    carbs_per_100g: 1.9,  fat_per_100g: 4.8 },
  { product_name: "Whey Protein (powder)",calories_per_100g: 400, protein_per_100g: 80,  carbs_per_100g: 5,    fat_per_100g: 5 },

  // ---------- Breakfast / Grains ----------
  { product_name: "Oats (rolled, dry)",  calories_per_100g: 389, protein_per_100g: 17,   carbs_per_100g: 66,   fat_per_100g: 7 },
  { product_name: "Oats (cooked)",       calories_per_100g: 71,  protein_per_100g: 2.5,  carbs_per_100g: 12,   fat_per_100g: 1.5 },
  { product_name: "Muesli",              calories_per_100g: 354, protein_per_100g: 10,   carbs_per_100g: 67,   fat_per_100g: 7 },
  { product_name: "Cornflakes",          calories_per_100g: 357, protein_per_100g: 7,    carbs_per_100g: 84,   fat_per_100g: 0.4 },
  { product_name: "Whole Wheat Bread",   calories_per_100g: 247, protein_per_100g: 13,   carbs_per_100g: 41,   fat_per_100g: 4 },
  { product_name: "White Bread",         calories_per_100g: 265, protein_per_100g: 9,    carbs_per_100g: 49,   fat_per_100g: 3 },
  { product_name: "Pasta (cooked)",      calories_per_100g: 131, protein_per_100g: 5,    carbs_per_100g: 25,   fat_per_100g: 1.1 },

  // ---------- Fruits ----------
  { product_name: "Banana",              calories_per_100g: 89,  protein_per_100g: 1.1,  carbs_per_100g: 23,   fat_per_100g: 0.3 },
  { product_name: "Apple",               calories_per_100g: 52,  protein_per_100g: 0.3,  carbs_per_100g: 14,   fat_per_100g: 0.2 },
  { product_name: "Mango",               calories_per_100g: 60,  protein_per_100g: 0.8,  carbs_per_100g: 15,   fat_per_100g: 0.4 },
  { product_name: "Orange",              calories_per_100g: 47,  protein_per_100g: 0.9,  carbs_per_100g: 12,   fat_per_100g: 0.1 },
  { product_name: "Pomegranate",         calories_per_100g: 83,  protein_per_100g: 1.7,  carbs_per_100g: 19,   fat_per_100g: 1.2 },
  { product_name: "Grapes",              calories_per_100g: 67,  protein_per_100g: 0.6,  carbs_per_100g: 17,   fat_per_100g: 0.2 },
  { product_name: "Watermelon",          calories_per_100g: 30,  protein_per_100g: 0.6,  carbs_per_100g: 8,    fat_per_100g: 0.2 },
  { product_name: "Papaya",              calories_per_100g: 43,  protein_per_100g: 0.5,  carbs_per_100g: 11,   fat_per_100g: 0.3 },
  { product_name: "Pineapple",           calories_per_100g: 50,  protein_per_100g: 0.5,  carbs_per_100g: 13,   fat_per_100g: 0.1 },
  { product_name: "Guava",               calories_per_100g: 68,  protein_per_100g: 2.6,  carbs_per_100g: 14,   fat_per_100g: 1 },
  { product_name: "Strawberries",        calories_per_100g: 32,  protein_per_100g: 0.7,  carbs_per_100g: 7.7,  fat_per_100g: 0.3 },
  { product_name: "Avocado",             calories_per_100g: 160, protein_per_100g: 2,    carbs_per_100g: 9,    fat_per_100g: 15 },

  // ---------- Vegetables ----------
  { product_name: "Spinach (raw)",       calories_per_100g: 23,  protein_per_100g: 2.9,  carbs_per_100g: 3.6,  fat_per_100g: 0.4 },
  { product_name: "Broccoli (cooked)",   calories_per_100g: 35,  protein_per_100g: 2.4,  carbs_per_100g: 7,    fat_per_100g: 0.4 },
  { product_name: "Carrot",              calories_per_100g: 41,  protein_per_100g: 0.9,  carbs_per_100g: 10,   fat_per_100g: 0.2 },
  { product_name: "Tomato",              calories_per_100g: 18,  protein_per_100g: 0.9,  carbs_per_100g: 3.9,  fat_per_100g: 0.2 },
  { product_name: "Cucumber",            calories_per_100g: 16,  protein_per_100g: 0.7,  carbs_per_100g: 3.6,  fat_per_100g: 0.1 },
  { product_name: "Onion",               calories_per_100g: 40,  protein_per_100g: 1.1,  carbs_per_100g: 9.3,  fat_per_100g: 0.1 },
  { product_name: "Potato (boiled)",     calories_per_100g: 87,  protein_per_100g: 1.9,  carbs_per_100g: 20,   fat_per_100g: 0.1 },
  { product_name: "Sweet Potato (boiled)",calories_per_100g: 76, protein_per_100g: 1.4,  carbs_per_100g: 18,   fat_per_100g: 0.1 },
  { product_name: "Cauliflower (cooked)",calories_per_100g: 23,  protein_per_100g: 1.8,  carbs_per_100g: 4,    fat_per_100g: 0.5 },
  { product_name: "Capsicum (bell pepper)",calories_per_100g: 31,protein_per_100g: 1,    carbs_per_100g: 6,    fat_per_100g: 0.3 },

  // ---------- Nuts & Seeds ----------
  { product_name: "Almonds",             calories_per_100g: 579, protein_per_100g: 21,   carbs_per_100g: 22,   fat_per_100g: 50 },
  { product_name: "Cashews",             calories_per_100g: 553, protein_per_100g: 18,   carbs_per_100g: 30,   fat_per_100g: 44 },
  { product_name: "Peanuts",             calories_per_100g: 567, protein_per_100g: 26,   carbs_per_100g: 16,   fat_per_100g: 49 },
  { product_name: "Walnuts",             calories_per_100g: 654, protein_per_100g: 15,   carbs_per_100g: 14,   fat_per_100g: 65 },
  { product_name: "Peanut Butter",       calories_per_100g: 588, protein_per_100g: 25,   carbs_per_100g: 20,   fat_per_100g: 50 },
  { product_name: "Chia Seeds",          calories_per_100g: 486, protein_per_100g: 17,   carbs_per_100g: 42,   fat_per_100g: 31 },

  // ---------- Beverages ----------
  { product_name: "Black Coffee",        calories_per_100g: 2,   protein_per_100g: 0.3,  carbs_per_100g: 0,    fat_per_100g: 0 },
  { product_name: "Chai (with milk & sugar)",calories_per_100g: 50, protein_per_100g: 1.5,carbs_per_100g: 8,  fat_per_100g: 1.5 },
  { product_name: "Green Tea",           calories_per_100g: 1,   protein_per_100g: 0,    carbs_per_100g: 0,    fat_per_100g: 0 },
  { product_name: "Coconut Water",       calories_per_100g: 19,  protein_per_100g: 0.7,  carbs_per_100g: 3.7,  fat_per_100g: 0.2 },
  { product_name: "Lassi (sweet)",       calories_per_100g: 90,  protein_per_100g: 3,    carbs_per_100g: 13,   fat_per_100g: 3 },
  { product_name: "Buttermilk / Chaas",  calories_per_100g: 40,  protein_per_100g: 3,    carbs_per_100g: 4.8,  fat_per_100g: 0.9 },

  // ---------- Snacks ----------
  { product_name: "Samosa",              calories_per_100g: 308, protein_per_100g: 6,    carbs_per_100g: 32,   fat_per_100g: 18 },
  { product_name: "Pakora",              calories_per_100g: 320, protein_per_100g: 8,    carbs_per_100g: 30,   fat_per_100g: 19 },
  { product_name: "Dhokla",              calories_per_100g: 160, protein_per_100g: 6,    carbs_per_100g: 28,   fat_per_100g: 3 },
  { product_name: "Bhel Puri",           calories_per_100g: 195, protein_per_100g: 5,    carbs_per_100g: 33,   fat_per_100g: 5 },
  { product_name: "Dark Chocolate",      calories_per_100g: 546, protein_per_100g: 5,    carbs_per_100g: 61,   fat_per_100g: 31 },
  { product_name: "Milk Chocolate",      calories_per_100g: 535, protein_per_100g: 7.6,  carbs_per_100g: 59,   fat_per_100g: 30 },
];

/**
 * Case-insensitive multi-word substring search.
 * Returns matches sorted by relevance: starts-with > contains.
 */
export function searchLocalFoods(query: string): FoodSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const terms = q.split(/\s+/);

  const scored = LOCAL_FOODS
    .map((food) => {
      const name = food.product_name.toLowerCase();
      // All terms must appear
      if (!terms.every((t) => name.includes(t))) return null;
      // Rank: name starts with query gets highest score
      let score = 0;
      if (name.startsWith(q)) score += 100;
      if (name.includes(q)) score += 10;
      // Bonus: short names rank higher (more specific)
      score += Math.max(0, 30 - name.length);
      return { food, score };
    })
    .filter((x): x is { food: FoodSearchResult; score: number } => x !== null);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 30).map((s) => s.food);
}

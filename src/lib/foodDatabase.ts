import type { FoodSearchResult, FoodServing } from "./types";

/**
 * Common serving sizes for each food. The user can pick a chip
 * (e.g. "2 eggs") and we convert to grams internally.
 */
const SERVINGS: Record<string, FoodServing[]> = {
  // Eggs
  "Boiled Egg": [
    { label: "1 egg", grams: 50 },
    { label: "2 eggs", grams: 100 },
    { label: "3 eggs", grams: 150 },
  ],
  "Scrambled Egg": [
    { label: "1 egg", grams: 50 },
    { label: "2 eggs", grams: 100 },
    { label: "3 eggs", grams: 150 },
  ],
  "Fried Egg": [
    { label: "1 egg", grams: 50 },
    { label: "2 eggs", grams: 100 },
  ],
  "Omelette (plain)": [
    { label: "2-egg omelette", grams: 100 },
    { label: "3-egg omelette", grams: 150 },
  ],
  "Omelette (vegetable)": [
    { label: "2-egg omelette", grams: 110 },
    { label: "3-egg omelette", grams: 165 },
  ],
  "Egg White (cooked)": [
    { label: "1 egg white", grams: 33 },
    { label: "2 egg whites", grams: 66 },
    { label: "3 egg whites", grams: 99 },
  ],

  // Indian Breads
  "Roti / Chapati": [
    { label: "1 roti", grams: 40 },
    { label: "2 rotis", grams: 80 },
    { label: "3 rotis", grams: 120 },
  ],
  "Naan": [
    { label: "1/2 naan", grams: 45 },
    { label: "1 naan", grams: 90 },
  ],
  "Paratha (plain)": [
    { label: "1 paratha", grams: 80 },
    { label: "2 parathas", grams: 160 },
  ],
  "Aloo Paratha": [{ label: "1 paratha", grams: 110 }],
  "Paneer Paratha": [{ label: "1 paratha", grams: 120 }],
  "Puri": [
    { label: "1 puri", grams: 20 },
    { label: "3 puris", grams: 60 },
    { label: "5 puris", grams: 100 },
  ],
  "Bhatura": [{ label: "1 bhatura", grams: 100 }],

  // Rice & Biryani
  "White Rice (cooked)": [
    { label: "1 small bowl", grams: 100 },
    { label: "1 cup", grams: 150 },
    { label: "1 large bowl", grams: 200 },
  ],
  "Basmati Rice (cooked)": [
    { label: "1 small bowl", grams: 100 },
    { label: "1 cup", grams: 150 },
  ],
  "Brown Rice (cooked)": [
    { label: "1 small bowl", grams: 100 },
    { label: "1 cup", grams: 150 },
  ],
  "Jeera Rice": [
    { label: "1 small bowl", grams: 100 },
    { label: "1 cup", grams: 150 },
  ],
  "Vegetable Biryani": [
    { label: "1 bowl", grams: 200 },
    { label: "1 plate", grams: 300 },
  ],
  "Chicken Biryani": [
    { label: "1 bowl", grams: 200 },
    { label: "1 plate", grams: 300 },
  ],
  "Mutton Biryani": [
    { label: "1 bowl", grams: 200 },
    { label: "1 plate", grams: 300 },
  ],

  // Dal & Legumes
  "Dal Tadka": [
    { label: "1 small bowl", grams: 150 },
    { label: "1 large bowl", grams: 250 },
  ],
  "Moong Dal (cooked)": [
    { label: "1 small bowl", grams: 150 },
    { label: "1 large bowl", grams: 250 },
  ],
  "Masoor Dal": [
    { label: "1 small bowl", grams: 150 },
    { label: "1 large bowl", grams: 250 },
  ],
  "Chana / Chole": [
    { label: "1 small bowl", grams: 150 },
    { label: "1 large bowl", grams: 250 },
  ],
  "Rajma (kidney beans)": [
    { label: "1 small bowl", grams: 150 },
    { label: "1 large bowl", grams: 250 },
  ],
  "Black Dal (urad)": [
    { label: "1 small bowl", grams: 150 },
    { label: "1 large bowl", grams: 250 },
  ],

  // Paneer & Indian Veg
  Paneer: [
    { label: "50g cube", grams: 50 },
    { label: "100g serving", grams: 100 },
  ],
  "Palak Paneer": [
    { label: "1 bowl", grams: 200 },
    { label: "1 plate", grams: 250 },
  ],
  "Paneer Tikka": [
    { label: "4 pieces", grams: 120 },
    { label: "8 pieces", grams: 240 },
  ],
  "Aloo Gobi": [{ label: "1 bowl", grams: 200 }],
  "Bhindi Masala": [{ label: "1 bowl", grams: 200 }],
  "Mixed Vegetable Curry": [{ label: "1 bowl", grams: 200 }],
  "Baingan Bharta": [{ label: "1 bowl", grams: 200 }],
  "Kadai Paneer": [
    { label: "1 bowl", grams: 200 },
    { label: "1 plate", grams: 250 },
  ],
  "Malai Kofta": [{ label: "1 plate (4 koftas)", grams: 250 }],

  // Indian Non-Veg
  "Chicken Curry": [
    { label: "1 bowl", grams: 200 },
    { label: "1 plate", grams: 250 },
  ],
  "Butter Chicken": [
    { label: "1 bowl", grams: 200 },
    { label: "1 plate", grams: 250 },
  ],
  "Tandoori Chicken": [
    { label: "1 leg piece", grams: 150 },
    { label: "1/2 chicken", grams: 400 },
  ],
  "Chicken Tikka": [
    { label: "6 pieces", grams: 150 },
    { label: "8 pieces", grams: 200 },
  ],
  "Mutton Curry": [
    { label: "1 bowl", grams: 200 },
    { label: "1 plate", grams: 250 },
  ],
  "Fish Curry": [
    { label: "1 piece + gravy", grams: 180 },
    { label: "1 bowl", grams: 200 },
  ],
  "Keema (minced meat)": [{ label: "1 bowl", grams: 200 }],

  // South Indian
  Idli: [
    { label: "1 idli", grams: 50 },
    { label: "2 idlis", grams: 100 },
    { label: "3 idlis", grams: 150 },
    { label: "4 idlis", grams: 200 },
  ],
  "Dosa (plain)": [
    { label: "1 dosa", grams: 80 },
    { label: "2 dosas", grams: 160 },
  ],
  "Masala Dosa": [{ label: "1 masala dosa", grams: 180 }],
  Upma: [
    { label: "1 small bowl", grams: 150 },
    { label: "1 large bowl", grams: 250 },
  ],
  Poha: [
    { label: "1 small bowl", grams: 150 },
    { label: "1 large bowl", grams: 250 },
  ],
  "Medu Vada": [
    { label: "1 vada", grams: 40 },
    { label: "2 vadas", grams: 80 },
  ],
  Sambar: [
    { label: "1 small bowl", grams: 150 },
    { label: "1 cup", grams: 200 },
  ],
  Rasam: [{ label: "1 cup", grams: 200 }],
  Uttapam: [{ label: "1 uttapam", grams: 130 }],

  // Dairy & Beverages
  "Curd / Plain Yogurt": [
    { label: "1 small bowl", grams: 150 },
    { label: "1 cup", grams: 240 },
  ],
  "Greek Yogurt": [
    { label: "1 small cup (170g)", grams: 170 },
    { label: "1 cup", grams: 240 },
  ],
  "Whole Milk": [
    { label: "1 cup (240ml)", grams: 240 },
    { label: "1 glass (300ml)", grams: 300 },
  ],
  "Skim Milk": [
    { label: "1 cup (240ml)", grams: 240 },
    { label: "1 glass (300ml)", grams: 300 },
  ],
  "Toned Milk (Amul)": [
    { label: "1 cup (240ml)", grams: 240 },
    { label: "1 glass (300ml)", grams: 300 },
  ],
  Ghee: [
    { label: "1 tsp", grams: 5 },
    { label: "1 tbsp", grams: 15 },
  ],
  Butter: [
    { label: "1 tsp", grams: 5 },
    { label: "1 tbsp", grams: 15 },
  ],
  "Cheese (cheddar)": [
    { label: "1 slice", grams: 28 },
    { label: "1 cube", grams: 20 },
  ],
  "Cottage Cheese": [{ label: "1 small bowl", grams: 100 }],

  // Proteins
  "Chicken Breast (grilled)": [
    { label: "Small (100g)", grams: 100 },
    { label: "Medium (170g)", grams: 170 },
    { label: "Large (250g)", grams: 250 },
  ],
  "Chicken Thigh (cooked)": [{ label: "1 thigh", grams: 120 }],
  "Salmon (cooked)": [{ label: "1 fillet", grams: 170 }],
  "Tuna (canned, water)": [{ label: "1 small can", grams: 140 }],
  Tofu: [{ label: "1 block", grams: 100 }],
  "Whey Protein (powder)": [
    { label: "1 scoop", grams: 30 },
    { label: "2 scoops", grams: 60 },
  ],

  // Breakfast & Grains
  "Oats (rolled, dry)": [
    { label: "1/2 cup (40g)", grams: 40 },
    { label: "1 cup (80g)", grams: 80 },
  ],
  "Oats (cooked)": [{ label: "1 bowl", grams: 240 }],
  Muesli: [
    { label: "1/2 cup (40g)", grams: 40 },
    { label: "1 cup (80g)", grams: 80 },
  ],
  Cornflakes: [{ label: "1 cup (30g)", grams: 30 }],
  "Whole Wheat Bread": [
    { label: "1 slice", grams: 30 },
    { label: "2 slices", grams: 60 },
  ],
  "White Bread": [
    { label: "1 slice", grams: 30 },
    { label: "2 slices", grams: 60 },
  ],
  "Pasta (cooked)": [
    { label: "1 small bowl", grams: 150 },
    { label: "1 large bowl", grams: 250 },
  ],

  // Fruits
  Banana: [
    { label: "1 small", grams: 100 },
    { label: "1 medium", grams: 120 },
    { label: "1 large", grams: 150 },
  ],
  Apple: [
    { label: "1 medium", grams: 180 },
    { label: "1 large", grams: 220 },
  ],
  Mango: [{ label: "1 medium", grams: 200 }],
  Orange: [{ label: "1 medium", grams: 130 }],
  Pomegranate: [{ label: "1 medium", grams: 200 }],
  Grapes: [{ label: "1 cup", grams: 150 }],
  Watermelon: [
    { label: "1 cup diced", grams: 150 },
    { label: "1 slice (large)", grams: 280 },
  ],
  Papaya: [{ label: "1 cup diced", grams: 140 }],
  Pineapple: [{ label: "1 cup diced", grams: 165 }],
  Guava: [{ label: "1 medium", grams: 165 }],
  Strawberries: [{ label: "1 cup", grams: 150 }],
  Avocado: [
    { label: "1/2 avocado", grams: 100 },
    { label: "1 whole", grams: 200 },
  ],

  // Veg (commonly eaten whole)
  "Potato (boiled)": [{ label: "1 medium", grams: 150 }],
  "Sweet Potato (boiled)": [{ label: "1 medium", grams: 130 }],
  Tomato: [{ label: "1 medium", grams: 120 }],
  Onion: [{ label: "1 medium", grams: 110 }],

  // Nuts
  Almonds: [
    { label: "10 almonds", grams: 12 },
    { label: "1 handful (28g)", grams: 28 },
  ],
  Cashews: [
    { label: "10 cashews", grams: 15 },
    { label: "1 handful (28g)", grams: 28 },
  ],
  Peanuts: [{ label: "1 handful (28g)", grams: 28 }],
  Walnuts: [{ label: "10 halves (28g)", grams: 28 }],
  "Peanut Butter": [
    { label: "1 tbsp", grams: 16 },
    { label: "2 tbsp", grams: 32 },
  ],
  "Chia Seeds": [
    { label: "1 tbsp", grams: 12 },
    { label: "2 tbsp", grams: 24 },
  ],

  // Beverages
  "Black Coffee": [{ label: "1 cup (240ml)", grams: 240 }],
  "Chai (with milk & sugar)": [{ label: "1 cup (200ml)", grams: 200 }],
  "Green Tea": [{ label: "1 cup (240ml)", grams: 240 }],
  "Coconut Water": [
    { label: "1 cup (240ml)", grams: 240 },
    { label: "1 glass (300ml)", grams: 300 },
  ],
  "Lassi (sweet)": [{ label: "1 glass (250ml)", grams: 250 }],
  "Buttermilk / Chaas": [{ label: "1 glass (250ml)", grams: 250 }],

  // Snacks
  Samosa: [
    { label: "1 samosa", grams: 60 },
    { label: "2 samosas", grams: 120 },
  ],
  Pakora: [
    { label: "4 pieces", grams: 80 },
    { label: "1 plate", grams: 150 },
  ],
  Dhokla: [
    { label: "1 piece", grams: 40 },
    { label: "3 pieces", grams: 120 },
  ],
  "Bhel Puri": [
    { label: "1 small bowl", grams: 100 },
    { label: "1 large bowl", grams: 200 },
  ],
  "Dark Chocolate": [
    { label: "1 square", grams: 10 },
    { label: "1 small bar", grams: 40 },
  ],
  "Milk Chocolate": [
    { label: "1 square", grams: 10 },
    { label: "1 small bar", grams: 40 },
  ],
};

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
  return scored.slice(0, 30).map((s) => ({
    ...s.food,
    servings: SERVINGS[s.food.product_name],
  }));
}

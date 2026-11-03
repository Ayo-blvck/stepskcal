export type SeedCategory =
  | 'swallow'
  | 'soup'
  | 'rice_pasta'
  | 'yam_plantain'
  | 'protein'
  | 'snack'
  | 'fruit'
  | 'drink'
  | 'fast_food'
  | 'other';

export interface SeedFood {
  key: string; // never change a key once shipped
  name: string;
  category: SeedCategory;
  serving: string;
  kcal: number; // rough estimate for the serving
}

const WRAP = '1 medium wrap (~300 g)';
const SOUP = '1 serving (~250 ml, no meat)';
const PLATE = '1 plate (~300 g)';

export const SEED_FOODS: SeedFood[] = [
  // Swallows
  { key: 'eba', name: 'Eba (garri)', category: 'swallow', serving: WRAP, kcal: 380 },
  { key: 'amala', name: 'Amala (yam flour)', category: 'swallow', serving: WRAP, kcal: 340 },
  { key: 'pounded-yam', name: 'Pounded yam', category: 'swallow', serving: WRAP, kcal: 380 },
  { key: 'semo', name: 'Semo (semolina)', category: 'swallow', serving: WRAP, kcal: 360 },
  { key: 'wheat-swallow', name: 'Wheat swallow (whole wheat)', category: 'swallow', serving: WRAP, kcal: 340 },
  { key: 'fufu', name: 'Fufu (cassava)', category: 'swallow', serving: WRAP, kcal: 450 },
  { key: 'tuwo-shinkafa', name: 'Tuwo shinkafa (rice swallow)', category: 'swallow', serving: WRAP, kcal: 390 },

  // Soups and stews
  { key: 'egusi-soup', name: 'Egusi soup', category: 'soup', serving: SOUP, kcal: 450 },
  { key: 'efo-riro', name: 'Efo riro', category: 'soup', serving: SOUP, kcal: 300 },
  { key: 'okra-soup', name: 'Okra soup', category: 'soup', serving: SOUP, kcal: 180 },
  { key: 'ewedu', name: 'Ewedu', category: 'soup', serving: '1 serving (~150 ml)', kcal: 80 },
  { key: 'gbegiri', name: 'Gbegiri (bean soup)', category: 'soup', serving: '1 serving (~150 ml)', kcal: 200 },
  { key: 'ogbono-soup', name: 'Ogbono soup', category: 'soup', serving: SOUP, kcal: 400 },
  { key: 'vegetable-soup', name: 'Vegetable soup', category: 'soup', serving: SOUP, kcal: 250 },
  { key: 'banga-soup', name: 'Banga soup (palm nut)', category: 'soup', serving: SOUP, kcal: 450 },
  { key: 'afang-soup', name: 'Afang soup', category: 'soup', serving: SOUP, kcal: 350 },
  { key: 'pepper-soup', name: 'Pepper soup (fish or goat)', category: 'soup', serving: '1 bowl (~300 ml)', kcal: 200 },
  { key: 'tomato-stew', name: 'Tomato / pepper stew (obe ata)', category: 'soup', serving: '2 serving spoons (~100 g)', kcal: 180 },

  // Rice, pasta, noodles
  { key: 'jollof-rice', name: 'Jollof rice', category: 'rice_pasta', serving: PLATE, kcal: 480 },
  { key: 'white-rice', name: 'White rice', category: 'rice_pasta', serving: PLATE, kcal: 390 },
  { key: 'fried-rice', name: 'Fried rice', category: 'rice_pasta', serving: PLATE, kcal: 500 },
  { key: 'coconut-rice', name: 'Coconut rice', category: 'rice_pasta', serving: PLATE, kcal: 550 },
  { key: 'jollof-spaghetti', name: 'Jollof spaghetti', category: 'rice_pasta', serving: PLATE, kcal: 450 },
  { key: 'spaghetti-plain', name: 'Spaghetti, boiled', category: 'rice_pasta', serving: '1 plate (~250 g)', kcal: 390 },
  { key: 'indomie-70', name: 'Indomie noodles', category: 'rice_pasta', serving: '1 pack (70 g), cooked', kcal: 315 },
  { key: 'indomie-120', name: 'Indomie noodles, super pack', category: 'rice_pasta', serving: '1 pack (120 g), cooked', kcal: 510 },

  // Yam, plantain, tubers
  { key: 'boiled-yam', name: 'Boiled yam', category: 'yam_plantain', serving: '3 medium slices (~200 g)', kcal: 240 },
  { key: 'fried-yam', name: 'Fried yam', category: 'yam_plantain', serving: '5 pieces (~150 g)', kcal: 330 },
  { key: 'roasted-yam', name: 'Roasted yam', category: 'yam_plantain', serving: '1 portion (~200 g)', kcal: 240 },
  { key: 'yam-porridge', name: 'Yam porridge (asaro)', category: 'yam_plantain', serving: PLATE, kcal: 450 },
  { key: 'fried-plantain', name: 'Fried plantain (dodo)', category: 'yam_plantain', serving: '6 slices (~100 g)', kcal: 240 },
  { key: 'boiled-plantain', name: 'Boiled plantain', category: 'yam_plantain', serving: '1 medium (~150 g)', kcal: 180 },
  { key: 'roasted-plantain', name: 'Roasted plantain (boli)', category: 'yam_plantain', serving: '1 medium (~200 g)', kcal: 250 },
  { key: 'plantain-chips', name: 'Plantain chips', category: 'yam_plantain', serving: '1 small pack (~40 g)', kcal: 200 },
  { key: 'sweet-potato', name: 'Sweet potato, boiled', category: 'yam_plantain', serving: '1 medium (~150 g)', kcal: 130 },

  // Eggs, meat, fish, beans
  { key: 'egg-boiled', name: 'Boiled egg', category: 'protein', serving: '1 large egg', kcal: 75 },
  { key: 'egg-fried', name: 'Fried egg', category: 'protein', serving: '1 large egg', kcal: 100 },
  { key: 'egg-scrambled', name: 'Scrambled eggs', category: 'protein', serving: '2 eggs, with oil', kcal: 230 },
  { key: 'omelette', name: 'Omelette', category: 'protein', serving: '2 eggs', kcal: 250 },
  { key: 'chicken-fried', name: 'Fried chicken', category: 'protein', serving: '1 piece (~100 g)', kcal: 260 },
  { key: 'chicken-grilled', name: 'Grilled / boiled chicken', category: 'protein', serving: '1 piece (~100 g)', kcal: 190 },
  { key: 'beef-stewed', name: 'Beef, stewed', category: 'protein', serving: '1 medium piece (~50 g)', kcal: 120 },
  { key: 'goat-meat', name: 'Goat meat', category: 'protein', serving: '1 medium piece (~50 g)', kcal: 90 },
  { key: 'fish-fried', name: 'Fried fish', category: 'protein', serving: '1 medium piece (~80 g)', kcal: 200 },
  { key: 'fish-smoked', name: 'Smoked / dried fish', category: 'protein', serving: '1 piece (~40 g)', kcal: 100 },
  { key: 'ponmo', name: 'Ponmo (cow skin)', category: 'protein', serving: '1 piece (~40 g)', kcal: 70 },
  { key: 'suya', name: 'Beef suya', category: 'protein', serving: '1 portion (~100 g)', kcal: 280 },
  { key: 'moi-moi', name: 'Moi moi', category: 'protein', serving: '1 wrap (~150 g)', kcal: 220 },
  { key: 'akara', name: 'Akara (bean cakes)', category: 'protein', serving: '3 balls (~90 g)', kcal: 250 },
  { key: 'beans-boiled', name: 'Boiled beans (ewa)', category: 'protein', serving: '1 plate (~250 g, with palm oil)', kcal: 400 },

  // Snacks, bread, biscuits
  { key: 'puff-puff', name: 'Puff puff', category: 'snack', serving: '1 ball (~35 g)', kcal: 90 },
  { key: 'chin-chin', name: 'Chin chin', category: 'snack', serving: '1 handful (~40 g)', kcal: 200 },
  { key: 'meat-pie', name: 'Meat pie', category: 'snack', serving: '1 pie', kcal: 380 },
  { key: 'sausage-roll', name: 'Sausage roll', category: 'snack', serving: '1 roll', kcal: 300 },
  { key: 'doughnut', name: 'Doughnut', category: 'snack', serving: '1 piece', kcal: 250 },
  { key: 'groundnuts', name: 'Groundnuts (peanuts)', category: 'snack', serving: '1 handful (~30 g)', kcal: 170 },
  { key: 'bread-agege', name: 'Agege bread', category: 'snack', serving: '1 thick slice (~50 g)', kcal: 130 },
  { key: 'bread-sliced', name: 'Sliced bread', category: 'snack', serving: '1 slice (~30 g)', kcal: 80 },
  { key: 'biscuit-plain', name: 'Biscuit, plain', category: 'snack', serving: '1 piece', kcal: 45 },
  { key: 'biscuit-cream', name: 'Cream sandwich biscuit', category: 'snack', serving: '1 piece', kcal: 70 },
  { key: 'biscuit-pack', name: 'Biscuit, small pack', category: 'snack', serving: '1 pack (~40 g)', kcal: 200 },
  { key: 'chocolate-bar', name: 'Chocolate bar', category: 'snack', serving: '1 bar (~45 g)', kcal: 240 },
  { key: 'cake-slice', name: 'Cake', category: 'snack', serving: '1 slice', kcal: 350 },

  // Fruit
  { key: 'apple', name: 'Apple', category: 'fruit', serving: '1 medium', kcal: 95 },
  { key: 'banana', name: 'Banana', category: 'fruit', serving: '1 medium', kcal: 105 },
  { key: 'orange', name: 'Orange', category: 'fruit', serving: '1 medium', kcal: 62 },
  { key: 'pineapple', name: 'Pineapple', category: 'fruit', serving: '2 slices (~150 g)', kcal: 75 },
  { key: 'watermelon', name: 'Watermelon', category: 'fruit', serving: '1 large slice (~300 g)', kcal: 90 },
  { key: 'mango', name: 'Mango', category: 'fruit', serving: '1 medium', kcal: 150 },
  { key: 'pawpaw', name: 'Pawpaw (papaya)', category: 'fruit', serving: '1 slice (~200 g)', kcal: 80 },
  { key: 'pear', name: 'Pear', category: 'fruit', serving: '1 medium', kcal: 100 },
  { key: 'grapes', name: 'Grapes', category: 'fruit', serving: '1 handful (~80 g)', kcal: 55 },
  { key: 'avocado', name: 'Avocado', category: 'fruit', serving: 'Half', kcal: 160 },

  // Drinks
  { key: 'water', name: 'Water', category: 'drink', serving: '1 glass or bottle', kcal: 0 },
  { key: 'coke-50', name: 'Coca-Cola', category: 'drink', serving: '50 cl bottle', kcal: 210 },
  { key: 'coke-35', name: 'Coca-Cola', category: 'drink', serving: '35 cl bottle', kcal: 150 },
  { key: 'fanta-50', name: 'Fanta', category: 'drink', serving: '50 cl bottle', kcal: 215 },
  { key: 'sprite-50', name: 'Sprite', category: 'drink', serving: '50 cl bottle', kcal: 200 },
  { key: 'pepsi-50', name: 'Pepsi', category: 'drink', serving: '50 cl bottle', kcal: 225 },
  { key: 'soda-can', name: 'Soda (any brand)', category: 'drink', serving: '1 can (33 cl)', kcal: 140 },
  { key: 'zero-soda', name: 'Zero / diet soda', category: 'drink', serving: 'Any size', kcal: 0 },
  { key: 'malt-drink', name: 'Malt drink (Malta Guinness etc.)', category: 'drink', serving: '33 cl', kcal: 150 },
  { key: 'zobo', name: 'Zobo (sweetened)', category: 'drink', serving: '1 cup (~250 ml)', kcal: 90 },
  { key: 'packaged-juice', name: 'Packaged fruit juice', category: 'drink', serving: '1 small pack (33 cl)', kcal: 150 },
  { key: 'tea-milk-sugar', name: 'Tea with milk and sugar', category: 'drink', serving: '1 mug, 2 tsp sugar', kcal: 70 },
  { key: 'milo', name: 'Milo / chocolate drink', category: 'drink', serving: '1 mug, with milk and sugar', kcal: 200 },
  { key: 'yoghurt', name: 'Yoghurt, sweetened', category: 'drink', serving: '1 small bottle (~200 ml)', kcal: 150 },
  { key: 'beer-33', name: 'Beer', category: 'drink', serving: '33 cl bottle', kcal: 140 },
  { key: 'beer-60', name: 'Beer', category: 'drink', serving: '60 cl bottle', kcal: 250 },

  // Fast food
  { key: 'shawarma-chicken', name: 'Chicken shawarma', category: 'fast_food', serving: '1 regular wrap', kcal: 550 },
  { key: 'shawarma-beef', name: 'Beef shawarma', category: 'fast_food', serving: '1 regular wrap', kcal: 650 },
  { key: 'burger', name: 'Burger', category: 'fast_food', serving: '1 regular', kcal: 500 },
  { key: 'pizza-slice', name: 'Pizza', category: 'fast_food', serving: '1 slice', kcal: 280 },
  { key: 'fries', name: 'French fries', category: 'fast_food', serving: '1 medium portion (~120 g)', kcal: 380 },

  // Other, including cooking extras
  { key: 'pap-ogi', name: 'Pap (ogi), with milk and sugar', category: 'other', serving: '1 bowl (~300 ml)', kcal: 200 },
  { key: 'garri-soaked', name: 'Garri, soaked', category: 'other', serving: '1 bowl (~50 g dry, sugar, milk)', kcal: 320 },
  { key: 'palm-oil', name: 'Palm oil', category: 'other', serving: '1 tablespoon', kcal: 120 },
  { key: 'veg-oil', name: 'Vegetable oil', category: 'other', serving: '1 tablespoon', kcal: 120 },
  { key: 'sugar', name: 'Sugar', category: 'other', serving: '1 teaspoon', kcal: 16 },
  { key: 'butter', name: 'Butter / margarine', category: 'other', serving: '1 tablespoon', kcal: 100 },
];
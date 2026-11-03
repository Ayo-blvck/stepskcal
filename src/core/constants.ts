export const ACTIVITY_FACTOR_SEDENTARY = 1.2;
export const CALORIE_FLOOR = { male: 1500, female: 1200 } as const;
export const STEP_LENGTH_FACTOR = 0.414; // step length = height * factor
export const NET_WALK_KCAL_PER_KG_KM = 0.53;
export const ACTIVITY_CREDIT = 0.5; // share of logged activity kcal that counts
export const KCAL_PER_KG_FAT = 7700;
export const DEFAULTS = { dailyDeficitKcal: 500, stepFloor: 8000, stepCap: 20000 };
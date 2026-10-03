export interface NutrientTargets {
  calories?: number;
  protein_g?: number;
  fat_g?: number;
  carbs_g?: number;
  fiber_g?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
  エネルギー?: number;
  タンパク質?: number;
  脂質?: number;
  炭水化物?: number;
  食物繊維?: number;
}

export interface MealRecord {
  id: string;
  timestamp?: string | number | Date;
  createdAt?: string | number | Date;
  date?: string;
  foodText?: string;
  rawText?: string;
  text?: string;
  nutrients?: NutrientTargets | Record<string, any>;
  [key: string]: any;
}

export interface DeficiencyInfo {
  name: string;
  key?: string;
  current?: number;
  target?: number;
  ratio?: number;
  diff?: number;
  unit?: string;
  [key: string]: any;
}

/**
 * 不足している栄養素を計算・抽出する関数
 */
export function getTopDeficiencies(
  intakeData?: any,
  targetData?: any,
  limit: number = 3
): any[] {
  if (!intakeData) return [];

  const results: DeficiencyInfo[] = [];

  if (typeof intakeData === "object" && intakeData !== null) {
    for (const [key, val] of Object.entries(intakeData)) {
      const currentVal = typeof val === "number" ? val : parseFloat(val as string);
      if (isNaN(currentVal)) continue;

      const targetVal = targetData && targetData[key] ? Number(targetData[key]) : undefined;
      if (targetVal && targetVal > 0 && currentVal < targetVal) {
        results.push({
          name: key,
          key,
          current: currentVal,
          target: targetVal,
          ratio: currentVal / targetVal,
          diff: targetVal - currentVal,
        });
      }
    }
  }

  return results.sort((a, b) => (a.ratio ?? 0) - (b.ratio ?? 0)).slice(0, limit);
}
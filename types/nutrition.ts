export interface NutrientTargets {
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
  salt_equivalent_g: number;
  vitamin_a_ug: number;
  vitamin_b1_mg: number;
  vitamin_b2_mg: number;
  vitamin_c_mg: number;
  vitamin_d_ug: number;
  calcium_mg: number;
  iron_mg: number;
  zinc_mg: number;
  potassium_mg: number;
  magnesium_mg: number;
}

export interface DeficientNutrient {
  key: keyof NutrientTargets;
  name: string;
  consumed: number;
  target_3days: number;
  deficiency_amount: number;
  fulfillment_rate: number;
  unit: string;
}

export function getTopDeficiencies(
  consumed3Days: NutrientTargets,
  dailyTarget: NutrientTargets,
  topN: number = 3
): DeficientNutrient[] {
  const nutrientLabels: Record<keyof NutrientTargets, { name: string; unit: string }> = {
    calories_kcal: { name: "エネルギー", unit: "kcal" },
    protein_g: { name: "たんぱく質", unit: "g" },
    fat_g: { name: "脂質", unit: "g" },
    carbs_g: { name: "炭水化物", unit: "g" },
    fiber_g: { name: "食物繊維", unit: "g" },
    salt_equivalent_g: { name: "食塩相当量", unit: "g" },
    vitamin_a_ug: { name: "ビタミンA", unit: "μgRAE" },
    vitamin_b1_mg: { name: "ビタミンB1", unit: "mg" },
    vitamin_b2_mg: { name: "ビタミンB2", unit: "mg" },
    vitamin_c_mg: { name: "ビタミンC", unit: "mg" },
    vitamin_d_ug: { name: "ビタミンD", unit: "μg" },
    calcium_mg: { name: "カルシウム", unit: "mg" },
    iron_mg: { name: "鉄", unit: "mg" },
    zinc_mg: { name: "亜鉛", unit: "mg" },
    potassium_mg: { name: "カリウム", unit: "mg" },
    magnesium_mg: { name: "マグネシウム", unit: "mg" },
  };

  const results: DeficientNutrient[] = [];

  for (const key of Object.keys(dailyTarget) as (keyof NutrientTargets)[]) {
    if (key === "salt_equivalent_g" || key === "fat_g" || key === "calories_kcal") {
      continue;
    }

    const target3Days = dailyTarget[key] * 3;
    const consumed = consumed3Days[key] || 0;
    const rate = (consumed / target3Days) * 100;

    if (rate < 100) {
      results.push({
        key,
        name: nutrientLabels[key].name,
        consumed: Number(consumed.toFixed(1)),
        target_3days: Number(target3Days.toFixed(1)),
        deficiency_amount: Number((target3Days - consumed).toFixed(1)),
        fulfillment_rate: Number(rate.toFixed(1)),
        unit: nutrientLabels[key].unit,
      });
    }
  }

  return results.sort((a, b) => a.fulfillment_rate - b.fulfillment_rate).slice(0, topN);
}
export interface NutrientTargets {
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
  salt_equivalent_g: number;
  vitamin_a_ug: number;
  vitamin_b1_mg: number;
  vitamin_b2_mg: number;
  vitamin_c_mg: number;
  vitamin_d_ug: number;
  calcium_mg: number;
  iron_mg: number;
  zinc_mg: number;
  potassium_mg: number;
  magnesium_mg: number;
}

// 1回分の食事ログの型
export interface MealRecord {
  id: string;
  consumedAt: string; // ISO 8601形式 (例: 2026-09-05T12:00:00.000Z)
  inputText: string;
  mealSummary: string;
  nutrients: NutrientTargets;
}
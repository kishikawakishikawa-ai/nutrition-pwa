import { Schema, Type } from "@google/genai";

export const mealAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    meal_summary: {
      type: Type.STRING,
      description: "食事全体の簡潔な説明",
    },
    items: {
      type: Type.ARRAY,
      description: "食事を構成する各品目・食材のリスト",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "料理名または食材名" },
          estimated_weight_g: { type: Type.NUMBER, description: "推定重量（グラム）" },
          confidence: {
            type: Type.STRING,
            enum: ["low", "medium", "high"],
            description: "推定の確信度",
          },
          nutrients: {
            type: Type.OBJECT,
            properties: {
              calories_kcal: { type: Type.NUMBER, description: "エネルギー (kcal)" },
              protein_g: { type: Type.NUMBER, description: "たんぱく質 (g)" },
              fat_g: { type: Type.NUMBER, description: "脂質 (g)" },
              carbs_g: { type: Type.NUMBER, description: "炭水化物 (g)" },
              fiber_g: { type: Type.NUMBER, description: "食物繊維 (g)" },
              salt_equivalent_g: { type: Type.NUMBER, description: "食塩相当量 (g)" },
              vitamin_a_ug: { type: Type.NUMBER, description: "ビタミンA (μgRAE)" },
              vitamin_b1_mg: { type: Type.NUMBER, description: "ビタミンB1 (mg)" },
              vitamin_b2_mg: { type: Type.NUMBER, description: "ビタミンB2 (mg)" },
              vitamin_c_mg: { type: Type.NUMBER, description: "ビタミンC (mg)" },
              vitamin_d_ug: { type: Type.NUMBER, description: "ビタミンD (μg)" },
              calcium_mg: { type: Type.NUMBER, description: "カルシウム (mg)" },
              iron_mg: { type: Type.NUMBER, description: "鉄 (mg)" },
              zinc_mg: { type: Type.NUMBER, description: "亜鉛 (mg)" },
              potassium_mg: { type: Type.NUMBER, description: "カリウム (mg)" },
              magnesium_mg: { type: Type.NUMBER, description: "マグネシウム (mg)" },
            },
            required: [
              "calories_kcal", "protein_g", "fat_g", "carbs_g", "fiber_g",
              "salt_equivalent_g", "vitamin_a_ug", "vitamin_b1_mg", "vitamin_b2_mg",
              "vitamin_c_mg", "vitamin_d_ug", "calcium_mg", "iron_mg", "zinc_mg",
              "potassium_mg", "magnesium_mg"
            ],
          },
        },
        required: ["name", "estimated_weight_g", "confidence", "nutrients"],
      },
    },
  },
  required: ["meal_summary", "items"],
};
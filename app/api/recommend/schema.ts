import { Schema, Type } from "@google/genai";

export const recommendationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    period_summary: {
      type: Type.STRING,
      description: "直近3日間の栄養状態の総括",
    },
    recommendations: {
      type: Type.ARRAY,
      description: "不足栄養素ごとの食材および料理の提案リスト",
      items: {
        type: Type.OBJECT,
        properties: {
          target_nutrient: { type: Type.STRING, description: "不足栄養素名" },
          reason: { type: Type.STRING, description: "補う理由" },
          recommended_ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "食材名" },
                portion_example: { type: Type.STRING, description: "目安量" },
                nutrient_richness: { type: Type.STRING, description: "栄養特徴" },
              },
              required: ["name", "portion_example", "nutrient_richness"],
            },
          },
          recommended_dishes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dish_name: { type: Type.STRING, description: "料理名" },
                cooking_time_min: { type: Type.NUMBER, description: "調理時間（分）" },
                key_ingredients: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "主要食材",
                },
                simple_recipe: { type: Type.STRING, description: "簡易レシピ" },
              },
              required: ["dish_name", "cooking_time_min", "key_ingredients", "simple_recipe"],
            },
          },
        },
        required: ["target_nutrient", "reason", "recommended_ingredients", "recommended_dishes"],
      },
    },
  },
  required: ["period_summary", "recommendations"],
};
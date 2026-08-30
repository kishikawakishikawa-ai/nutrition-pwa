"use client";

import React from "react";
import { Sparkles, Utensils, Clock, Apple, AlertCircle } from "lucide-react";

interface Ingredient {
  name: string;
  portion_example: string;
  nutrient_richness: string;
}

interface Dish {
  dish_name: string;
  cooking_time_min: number;
  key_ingredients: string[];
  simple_recipe: string;
}

interface RecommendationItem {
  target_nutrient: string;
  reason: string;
  recommended_ingredients: Ingredient[];
  recommended_dishes: Dish[];
}

interface RecommendationData {
  period_summary: string;
  recommendations: RecommendationItem[];
}

interface RecommendationViewProps {
  data: RecommendationData | null;
  isLoading?: boolean;
}

export const RecommendationView: React.FC<RecommendationViewProps> = ({
  data,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3 bg-white rounded-2xl border border-gray-100">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">
          3日間の栄養バランスを解析中...
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-gray-800">
            直近3日間の栄養分析
          </h3>
        </div>
        <p className="text-xs text-gray-700 leading-relaxed">
          {data.period_summary}
        </p>
      </div>

      {data.recommendations.map((rec, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4"
        >
          <div className="border-b border-gray-100 pb-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                <AlertCircle className="w-3.5 h-3.5" />
                不足: {rec.target_nutrient}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-2">{rec.reason}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <Apple className="w-4 h-4 text-emerald-600" />
              おすすめの食材
            </div>
            <div className="grid grid-cols-1 gap-2">
              {rec.recommended_ingredients.map((ing, iIdx) => (
                <div
                  key={iIdx}
                  className="bg-emerald-50/50 border border-emerald-100/80 rounded-xl p-2.5 text-xs"
                >
                  <div className="flex justify-between items-center font-bold text-emerald-950 mb-0.5">
                    <span>{ing.name}</span>
                    <span className="text-[11px] font-normal text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-100">
                      目安: {ing.portion_example}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800/80">
                    {ing.nutrient_richness}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <Utensils className="w-4 h-4 text-orange-500" />
              おすすめの料理
            </div>
            <div className="space-y-2.5">
              {rec.recommended_dishes.map((dish, dIdx) => (
                <div
                  key={dIdx}
                  className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-900">
                      {dish.dish_name}
                    </h4>
                    <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                      <Clock className="w-3 h-3" />
                      約{dish.cooking_time_min}分
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {dish.key_ingredients.map((item, kIdx) => (
                      <span
                        key={kIdx}
                        className="text-[10px] bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <p className="text-[11px] text-gray-600 bg-white p-2 rounded-lg border border-gray-100 leading-normal">
                    {dish.simple_recipe}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
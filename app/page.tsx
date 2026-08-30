"use client";

import React, { useState } from "react";
import { MealInput } from "@/components/MealInput";
import { RecommendationView } from "@/components/RecommendationView";
import { NutrientTargets } from "@/types/nutrition";
import { RefreshCw, CheckCircle2 } from "lucide-react";

// 1日の目標摂取量（基準値）
const DEFAULT_DAILY_TARGET: NutrientTargets = {
  calories_kcal: 2200,
  protein_g: 65,
  fat_g: 60,
  carbs_g: 260,
  fiber_g: 21,
  salt_equivalent_g: 7.5,
  vitamin_a_ug: 850,
  vitamin_b1_mg: 1.4,
  vitamin_b2_mg: 1.6,
  vitamin_c_mg: 100,
  vitamin_d_ug: 8.5,
  calcium_mg: 750,
  iron_mg: 7.5,
  zinc_mg: 11,
  potassium_mg: 3000,
  magnesium_mg: 340,
};

// 初期状態（過去3日間の初期累積値）
const INITIAL_CONSUMED: NutrientTargets = {
  calories_kcal: 3000,
  protein_g: 100,
  fat_g: 110,
  carbs_g: 400,
  fiber_g: 20,
  salt_equivalent_g: 15,
  vitamin_a_ug: 900,
  vitamin_b1_mg: 1.8,
  vitamin_b2_mg: 1.9,
  vitamin_c_mg: 60,
  vitamin_d_ug: 6,
  calcium_mg: 800,
  iron_mg: 10,
  zinc_mg: 12,
  potassium_mg: 3500,
  magnesium_mg: 400,
};

export default function Home() {
  const [consumed3Days, setConsumed3Days] = useState<NutrientTargets>(INITIAL_CONSUMED);
  const [lastMealSummary, setLastMealSummary] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isRecLoading, setIsRecLoading] = useState(false);

  // 食事解析完了時の処理
  const handleAnalysisComplete = async (analysisResult: any) => {
    if (!analysisResult?.items) return;

    setLastMealSummary(analysisResult.meal_summary);

    // 解析された各品目の栄養素を合算
    const updated = { ...consumed3Days };
    for (const item of analysisResult.items) {
      if (!item.nutrients) continue;
      for (const key of Object.keys(updated) as (keyof NutrientTargets)[]) {
        updated[key] = (updated[key] || 0) + (item.nutrients[key] || 0);
      }
    }

    setConsumed3Days(updated);
    await fetchRecommendations(updated);
  };

  // レコメンドAPIの呼び出し
  const fetchRecommendations = async (currentConsumed: NutrientTargets = consumed3Days) => {
    setIsRecLoading(true);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consumed3Days: currentConsumed,
          dailyTarget: DEFAULT_DAILY_TARGET,
        }),
      });
      const data = await res.json();
      setRecommendations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRecLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900 pb-12 pt-safe">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/80 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <h1 className="text-base font-bold tracking-tight">3-Day Nutrition</h1>
          <button
            onClick={() => fetchRecommendations(consumed3Days)}
            disabled={isRecLoading}
            className="p-2 text-gray-500 hover:text-gray-800 active:scale-95 transition-transform"
          >
            <RefreshCw className={`w-4 h-4 ${isRecLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-5">
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
            食事を記録
          </h2>
          <MealInput onAnalysisComplete={handleAnalysisComplete} />
          {lastMealSummary && (
            <div className="mt-2 flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>記録完了: {lastMealSummary}</span>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
            不足栄養素と提案（3日間バランス）
          </h2>
          <RecommendationView data={recommendations} isLoading={isRecLoading} />
        </section>
      </div>
    </main>
  );
}
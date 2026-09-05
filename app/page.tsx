"use client";

import React, { useState, useEffect } from "react";
import { MealInput } from "@/components/MealInput";
import { RecommendationView } from "@/components/RecommendationView";
import { NutrientTargets, MealRecord } from "@/types/nutrition";
import { RefreshCw, CheckCircle2 } from "lucide-react";

const STORAGE_KEY = "nutrition_pwa_meal_records_v1";

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

// 栄養素のゼロ初期値
const ZERO_NUTRIENTS: NutrientTargets = {
  calories_kcal: 0,
  protein_g: 0,
  fat_g: 0,
  carbs_g: 0,
  fiber_g: 0,
  salt_equivalent_g: 0,
  vitamin_a_ug: 0,
  vitamin_b1_mg: 0,
  vitamin_b2_mg: 0,
  vitamin_c_mg: 0,
  vitamin_d_ug: 0,
  calcium_mg: 0,
  iron_mg: 0,
  zinc_mg: 0,
  potassium_mg: 0,
  magnesium_mg: 0,
};

export default function Home() {
  const [allRecords, setAllRecords] = useState<MealRecord[]>([]);
  const [lastMealSummary, setLastMealSummary] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecLoading, setIsRecLoading] = useState(false);

  // 初回マウント時にlocalStorageから過去の全履歴を読み込む
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: MealRecord[] = JSON.parse(saved);
        setAllRecords(parsed);
        // 保存データから直近3日分の栄養を集計して提案を取得
        const consumed = calculate3DaysConsumed(parsed);
        fetchRecommendations(consumed);
      }
    } catch (e) {
      console.error("履歴の読み込みに失敗しました", e);
    }
  }, []);

  // 直近72時間（3日間）の食事ログを抽出して合計栄養素を計算するロジック
  const calculate3DaysConsumed = (records: MealRecord[]): NutrientTargets => {
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const recentRecords = records.filter(
      (r) => new Date(r.consumedAt) >= seventyTwoHoursAgo
    );

    const total: NutrientTargets = { ...ZERO_NUTRIENTS };
    for (const record of recentRecords) {
      for (const key of Object.keys(total) as (keyof NutrientTargets)[]) {
        total[key] += record.nutrients[key] || 0;
      }
    }
    return total;
  };

  // 食事の解析と保存処理
  const handleRecordSubmit = async (text: string, consumedAtStr: string) => {
    setIsAnalyzing(true);
    try {
      // 1. 食事解析APIの呼び出し
      const res = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meal_text: text }),
      });
      const data = await res.json();

      // 各品目の栄養素を合算して単一の食事栄養素を算出
      const singleMealNutrients: NutrientTargets = { ...ZERO_NUTRIENTS };
      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          if (!item.nutrients) continue;
          for (const key of Object.keys(singleMealNutrients) as (keyof NutrientTargets)[]) {
            singleMealNutrients[key] += item.nutrients[key] || 0;
          }
        }
      }

      // 新しいレコードを作成
      const newRecord: MealRecord = {
        id: crypto.randomUUID(),
        consumedAt: new Date(consumedAtStr).toISOString(),
        inputText: text,
        mealSummary: data.meal_summary || text,
        nutrients: singleMealNutrients,
      };

      // 履歴を更新（最新順に保存）
      const updatedRecords = [newRecord, ...allRecords];
      setAllRecords(updatedRecords);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));

      setLastMealSummary(newRecord.mealSummary);

      // 直近3日分の栄養素を再計算してレコメンドAPIを呼び出し
      const updated3Days = calculate3DaysConsumed(updatedRecords);
      await fetchRecommendations(updated3Days);
    } catch (e) {
      console.error(e);
      alert("解析に失敗しました。もう一度お試しください。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // レコメンドAPIの呼び出し
  const fetchRecommendations = async (consumed: NutrientTargets) => {
    setIsRecLoading(true);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consumed3Days: consumed,
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
          <div>
            <h1 className="text-base font-bold tracking-tight">3-Day Nutrition</h1>
            <p className="text-[10px] text-gray-500">直近72時間の記録数: {allRecords.filter(r => new Date(r.consumedAt) >= new Date(Date.now() - 72 * 60 * 60 * 1000)).length}件</p>
          </div>
          <button
            onClick={() => fetchRecommendations(calculate3DaysConsumed(allRecords))}
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
          <MealInput
            onRecordSubmit={handleRecordSubmit}
            isAnalyzing={isAnalyzing}
          />
          {lastMealSummary && (
            <div className="mt-2 flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>記録完了: {lastMealSummary}</span>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
            不足栄養素と提案（直近3日間）
          </h2>
          <RecommendationView data={recommendations} isLoading={isRecLoading} />
        </section>
      </div>
    </main>
  );
}
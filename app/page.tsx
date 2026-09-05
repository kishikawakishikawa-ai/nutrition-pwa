"use client";

import React, { useState, useEffect } from "react";
import { MealInput } from "@/components/MealInput";
import { RecommendationView } from "@/components/RecommendationView";
import { NutrientTargets, MealRecord } from "@/types/nutrition";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

const STORAGE_KEY_RECORDS = "nutrition_pwa_meal_records_v2";
const STORAGE_KEY_REC = "nutrition_pwa_recommendations_v2";

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
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // クールダウンタイマー
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setTimeout(() => setCooldownSeconds((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  // 直近72時間の栄養素集計
  const calculate3DaysConsumed = (records: MealRecord[]): NutrientTargets => {
    if (!Array.isArray(records)) return { ...ZERO_NUTRIENTS };

    const seventyTwoHoursAgo = Date.now() - 72 * 60 * 60 * 1000;
    const recentRecords = records.filter((r) => {
      if (!r?.consumedAt) return false;
      const t = new Date(r.consumedAt).getTime();
      return !isNaN(t) && t >= seventyTwoHoursAgo;
    });

    const total: NutrientTargets = { ...ZERO_NUTRIENTS };
    for (const record of recentRecords) {
      if (!record?.nutrients) continue;
      for (const key of Object.keys(total) as (keyof NutrientTargets)[]) {
        total[key] += Number(record.nutrients[key]) || 0;
      }
    }
    return total;
  };

  // 初回ロード時：APIを呼ばず、localStorageから過去データと提案を復元
  useEffect(() => {
    try {
      const savedRecords = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (savedRecords) {
        const parsed = JSON.parse(savedRecords);
        if (Array.isArray(parsed)) setAllRecords(parsed);
      }

      const savedRec = localStorage.getItem(STORAGE_KEY_REC);
      if (savedRec) {
        setRecommendations(JSON.parse(savedRec));
      }
    } catch (e) {
      console.error("データ読み込みエラー:", e);
    }
  }, []);

  // レコメンドAPI呼び出し
  const fetchRecommendations = async (consumed: NutrientTargets) => {
    if (isRecLoading || cooldownSeconds > 0) return;

    setIsRecLoading(true);
    setRateLimitMessage(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consumed3Days: consumed,
          dailyTarget: DEFAULT_DAILY_TARGET,
        }),
      });

      if (res.status === 429) {
        setRateLimitMessage("APIの短時間利用上限に達しました。1〜2分待ってから再度お試しください。");
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "提案の取得に失敗しました");
      }

      const data = await res.json();
      setRecommendations(data);
      localStorage.setItem(STORAGE_KEY_REC, JSON.stringify(data));
      setCooldownSeconds(30); // 呼び出し成功後、30秒間クールダウン
    } catch (e: any) {
      console.error("Fetch recommendation failed:", e);
    } finally {
      setIsRecLoading(false);
    }
  };

  // 食事の解析と保存
  const handleRecordSubmit = async (text: string, consumedAtStr: string) => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    setRateLimitMessage(null);
    try {
      const res = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meal_text: text }),
      });

      if (res.status === 429) {
        setRateLimitMessage("APIの利用上限に達しています。1〜2分空けてから再記録してください。");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "食事解析に失敗しました");
      }

      const singleMealNutrients: NutrientTargets = { ...ZERO_NUTRIENTS };
      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          if (!item.nutrients) continue;
          for (const key of Object.keys(singleMealNutrients) as (keyof NutrientTargets)[]) {
            singleMealNutrients[key] += Number(item.nutrients[key]) || 0;
          }
        }
      }

      const newRecord: MealRecord = {
        id: crypto.randomUUID(),
        consumedAt: new Date(consumedAtStr).toISOString(),
        inputText: text,
        mealSummary: data.meal_summary || text,
        nutrients: singleMealNutrients,
      };

      const updatedRecords = [newRecord, ...allRecords];
      setAllRecords(updatedRecords);
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updatedRecords));
      setLastMealSummary(newRecord.mealSummary);

      // 食事記録後に提案を更新
      const updated3Days = calculate3DaysConsumed(updatedRecords);
      await fetchRecommendations(updated3Days);
    } catch (e: any) {
      console.error(e);
      alert(`解析エラー: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const validRecordCount = allRecords.filter((r) => {
    if (!r?.consumedAt) return false;
    const t = new Date(r.consumedAt).getTime();
    return !isNaN(t) && t >= Date.now() - 72 * 60 * 60 * 1000;
  }).length;

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900 pb-12 pt-safe">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/80 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight">3-Day Nutrition</h1>
            <p className="text-[10px] text-gray-500">直近72時間の記録数: {validRecordCount}件</p>
          </div>
          <button
            onClick={() => fetchRecommendations(calculate3DaysConsumed(allRecords))}
            disabled={isRecLoading || cooldownSeconds > 0}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 active:scale-95 transition-all"
            title="提案を手動更新"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecLoading ? "animate-spin" : ""}`} />
            <span>{cooldownSeconds > 0 ? `${cooldownSeconds}s` : "更新"}</span>
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-5">
        {/* レートリミット到達時の警告通知 */}
        {rateLimitMessage && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{rateLimitMessage}</span>
          </div>
        )}

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
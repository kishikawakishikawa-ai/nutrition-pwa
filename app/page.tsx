"use client";

import React, { useState, useEffect } from "react";
import { MealInput } from "@/components/MealInput";
import { RecommendationView } from "@/components/RecommendationView";
import { MealNutrientModal } from "@/components/MealNutrientModal";
import { HistoryModal } from "@/components/HistoryModal";
import { NutrientTargets, MealRecord } from "@/types/nutrition";
import { AlertCircle, Calendar } from "lucide-react";

const STORAGE_KEY_RECORDS = "nutrition_pwa_meal_records_v2";

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

// 補給食材マスターデータ（標準量と栄養含有量を定義）
const NUTRIENT_FOOD_PROPOSALS: Record<
  string,
  { food: string; base_unit: string; base_amount: number; reason: string }
> = {
  protein_g: { food: "鶏むね肉", base_unit: "100g", base_amount: 23.3, reason: "良質なタンパク質を効率よく補給できます。" },
  fat_g: { food: "素焼きアーモンド", base_unit: "10粒(10g)", base_amount: 5.4, reason: "細胞膜の健康を保つ不飽和脂肪酸を含みます。" },
  carbs_g: { food: "玄米ごはん", base_unit: "1杯(150g)", base_amount: 53.4, reason: "緩やかにエネルギーに変わる良質な炭水化物です。" },
  fiber_g: { food: "ごぼう", base_unit: "100g", base_amount: 5.7, reason: "水溶性・不溶性食物繊維を含み腸内環境を整えます。" },
  vitamin_a_ug: { food: "にんじん", base_unit: "半本(50g)", base_amount: 360, reason: "βカロテンが豊富で粘膜や皮膚の健康を維持します。" },
  vitamin_b1_mg: { food: "豚ヒレ肉", base_unit: "100g", base_amount: 1.32, reason: "糖質の代謝を促しエネルギー生成をサポートします。" },
  vitamin_b2_mg: { food: "納豆", base_unit: "1パック(50g)", base_amount: 0.28, reason: "脂質代謝に関与し、口内炎予防などをサポートします。" },
  vitamin_c_mg: { food: "キウイフルーツ", base_unit: "1個(100g)", base_amount: 71, reason: "コラーゲン生成と抗酸化作用を助けるビタミンCが豊富です。" },
  vitamin_d_ug: { food: "鮭", base_unit: "1切れ(100g)", base_amount: 32, reason: "カルシウムの吸収率を高め骨の健康に不可欠です。" },
  calcium_mg: { food: "木綿豆腐", base_unit: "1/2丁(150g)", base_amount: 130, reason: "骨や歯の健康維持と筋肉収縮に必要なカルシウム源です。" },
  iron_mg: { food: "小松菜", base_unit: "100g", base_amount: 2.8, reason: "ヘモグロビン形成に関与し酸欠による疲労を防ぎます。" },
  zinc_mg: { food: "牛もも赤身肉", base_unit: "100g", base_amount: 4.2, reason: "新陳代謝や免疫機能の維持に欠かせない微量ミネラルです。" },
  potassium_mg: { food: "バナナ", base_unit: "1本(100g)", base_amount: 360, reason: "ナトリウムの排出を促し体内の水分バランスを調整します。" },
  magnesium_mg: { food: "素焼きアーモンド", base_unit: "10粒(12g)", base_amount: 37, reason: "酵素反応を助け神経や筋肉の働きを調整します。" },
};

const NUTRIENT_LABELS: Record<keyof NutrientTargets, { name: string; unit: string }> = {
  calories_kcal: { name: "エネルギー", unit: "kcal" },
  protein_g: { name: "タンパク質", unit: "g" },
  fat_g: { name: "脂質", unit: "g" },
  carbs_g: { name: "炭水化物", unit: "g" },
  fiber_g: { name: "食物繊維", unit: "g" },
  salt_equivalent_g: { name: "食塩相当量", unit: "g" },
  vitamin_a_ug: { name: "ビタミンA", unit: "μg" },
  vitamin_b1_mg: { name: "ビタミンB1", unit: "mg" },
  vitamin_b2_mg: { name: "ビタミンB2", unit: "mg" },
  vitamin_c_mg: { name: "ビタミンC", unit: "mg" },
  vitamin_d_ug: { name: "ビタミンD", unit: "μg" },
  calcium_mg: { name: "カルシウム", unit: "mg" },
  iron_mg: { name: "鉄分", unit: "mg" },
  zinc_mg: { name: "亜鉛", unit: "mg" },
  potassium_mg: { name: "カリウム", unit: "mg" },
  magnesium_mg: { name: "マグネシウム", unit: "mg" },
};

export default function Home() {
  const [allRecords, setAllRecords] = useState<MealRecord[]>([]);
  const [lastRecordedItem, setLastRecordedItem] = useState<MealRecord | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

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

  const generateRecommendationsLocally = (consumed: NutrientTargets) => {
    const nutrientList: any[] = [];
    const shortageNames: string[] = [];

    const targetKeys: (keyof NutrientTargets)[] = [
      "protein_g",
      "fat_g",
      "carbs_g",
      "fiber_g",
      "vitamin_a_ug",
      "vitamin_b1_mg",
      "vitamin_b2_mg",
      "vitamin_c_mg",
      "vitamin_d_ug",
      "calcium_mg",
      "iron_mg",
      "zinc_mg",
      "potassium_mg",
      "magnesium_mg",
    ];

    for (const key of targetKeys) {
      const target3Days = DEFAULT_DAILY_TARGET[key] * 3;
      const actual = consumed[key] || 0;
      const gap = target3Days - actual;
      const isShortage = gap > 0;
      const proposal = NUTRIENT_FOOD_PROPOSALS[key];

      nutrientList.push({
        key,
        nutrient: NUTRIENT_LABELS[key]?.name || key,
        consumed: Math.round(actual * 10) / 10,
        target: Math.round(target3Days * 10) / 10,
        unit: NUTRIENT_LABELS[key]?.unit || "",
        gap: isShortage ? Math.round(gap * 10) / 10 : 0,
        proposal: proposal
          ? {
              food_name: proposal.food,
              base_unit: proposal.base_unit,
              base_amount: proposal.base_amount,
              reason: proposal.reason,
            }
          : null,
      });

      if (isShortage) {
        shortageNames.push(NUTRIENT_LABELS[key]?.name || key);
      }
    }

    const advice =
      shortageNames.length === 0
        ? "直近3日間の主要な栄養素はすべて充足されています。良好なバランスです。"
        : `直近3日間で特に「${shortageNames.slice(0, 3).join("・")}」が不足しています。各カードをタップして目安補給量を確認できます。`;

    setRecommendations({
      advice,
      nutrients: nutrientList,
    });
  };

  useEffect(() => {
    try {
      const savedRecords = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (savedRecords) {
        const parsed = JSON.parse(savedRecords);
        if (Array.isArray(parsed)) {
          setAllRecords(parsed);
          const consumed = calculate3DaysConsumed(parsed);
          generateRecommendationsLocally(consumed);
        }
      }
    } catch (e) {
      console.error("データ読み込みエラー:", e);
    }
  }, []);

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
        setRateLimitMessage("APIの制限に達しました。1〜2分待ってからお試しください。");
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "食事解析に失敗しました");

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

      setLastRecordedItem(newRecord);

      const updated3Days = calculate3DaysConsumed(updatedRecords);
      generateRecommendationsLocally(updated3Days);
    } catch (e: any) {
      console.error(e);
      alert(`記録エラー: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteRecord = (id: string) => {
    const updated = allRecords.filter((r) => r.id !== id);
    setAllRecords(updated);
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated));

    const updated3Days = calculate3DaysConsumed(updated);
    generateRecommendationsLocally(updated3Days);
  };

  const handleImportRecords = (importedRecords: MealRecord[]) => {
    setAllRecords(importedRecords);
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(importedRecords));

    const updated3Days = calculate3DaysConsumed(importedRecords);
    generateRecommendationsLocally(updated3Days);
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
            <p className="text-[10px] text-gray-500">直近72時間の記録: {validRecordCount}件 / 全{allRecords.length}件</p>
          </div>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium active:scale-95 transition-all"
            title="過去の記録と管理"
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>履歴・管理</span>
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-5">
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
        </section>

        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
            栄養素の摂取状況（直近3日間）
          </h2>
          <RecommendationView data={recommendations} isLoading={false} />
        </section>
      </div>

      <MealNutrientModal
        record={lastRecordedItem}
        onClose={() => setLastRecordedItem(null)}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        records={allRecords}
        onDeleteRecord={handleDeleteRecord}
        onImportRecords={handleImportRecords}
      />
    </main>
  );
}
"use client";

import React, { useState, useEffect } from "react";
import { MealInput } from "@/components/MealInput";
import { RecommendationView } from "@/components/RecommendationView";
import { MealNutrientModal } from "@/components/MealNutrientModal";
import { HistoryModal } from "@/components/HistoryModal";
import { NutrientTargets, MealRecord } from "@/types/nutrition";
import { CheckCircle2, AlertCircle, Calendar } from "lucide-react";

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

const NUTRIENT_FOOD_PROPOSALS: Record<string, { food: string; portion: string; reason: string }> = {
  protein_g: { food: "鶏むね肉・ゆで卵・納豆", portion: "1食分", reason: "良質なタンパク質を素早く補給できます。" },
  fiber_g: { food: "オートミール・ごぼう・わかめ", portion: "1小鉢", reason: "腸内環境を整え、食物繊維の不足を補います。" },
  vitamin_c_mg: { food: "ブロッコリー・キウイ・パプリカ", portion: "1個または小皿1杯", reason: "熱に強いビタミンCが豊富で、免疫維持をサポートします。" },
  iron_mg: { food: "小松菜・豚レバー・あさり", portion: "1品", reason: "鉄分を補い、酸素の運搬と疲労回復を助けます。" },
  calcium_mg: { food: "木綿豆腐・しらす・ヨーグルト", portion: "1パック", reason: "骨の健康維持に必要なカルシウムを効率よく摂取できます。" },
  vitamin_b1_mg: { food: "豚ヒレ肉・大豆製品・玄米", portion: "1品", reason: "炭水化物をエネルギーに変換する代謝を促進します。" },
  potassium_mg: { food: "バナナ・アボカド・ほうれん草", portion: "1本または1小鉢", reason: "塩分の排出を促し、体内の水分バランスを保ちます。" },
  zinc_mg: { food: "牡蠣・牛肉赤身・ナッツ類", portion: "手のひら1杯", reason: "新陳代謝と免疫機能を維持する亜鉛を補給できます。" },
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

  // ローカルレコメンド計算
  const generateRecommendationsLocally = (consumed: NutrientTargets) => {
    const shortages: any[] = [];
    const proposals: any[] = [];

    for (const key of Object.keys(DEFAULT_DAILY_TARGET) as (keyof NutrientTargets)[]) {
      if (key === "calories_kcal" || key === "salt_equivalent_g") continue;

      const target3Days = DEFAULT_DAILY_TARGET[key] * 3;
      const actual = consumed[key] || 0;
      const gap = target3Days - actual;

      if (gap > 0 && actual < target3Days * 0.7) {
        shortages.push({
          nutrient: NUTRIENT_LABELS[key]?.name || key,
          consumed: Math.round(actual * 10) / 10,
          target: Math.round(target3Days * 10) / 10,
          unit: NUTRIENT_LABELS[key]?.unit || "",
          gap: Math.round(gap * 10) / 10,
        });

        const matchedProposal = NUTRIENT_FOOD_PROPOSALS[key];
        if (matchedProposal && proposals.length < 3) {
          proposals.push({
            food_name: matchedProposal.food,
            portion: matchedProposal.portion,
            reason: `${NUTRIENT_LABELS[key]?.name}が不足傾向です。${matchedProposal.reason}`,
          });
        }
      }
    }

    const advice =
      shortages.length === 0
        ? "直近3日間の栄養バランスは良好です。現在の食生活を維持してください。"
        : `直近3日間で特に「${shortages.slice(0, 3).map((s) => s.nutrient).join("・")}」が不足しています。おすすめの食材を取り入れて補いましょう。`;

    setRecommendations({ advice, shortages, proposals });
  };

  // 初期読み込み
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

  // 食事の記録処理
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
        setRateLimitMessage("Gemini APIの制限に達しました。1〜2分待ってからお試しください。");
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

      // 記録完了モーダルを表示
      setLastRecordedItem(newRecord);

      // 直近3日分の提案を再計算
      const updated3Days = calculate3DaysConsumed(updatedRecords);
      generateRecommendationsLocally(updated3Days);
    } catch (e: any) {
      console.error(e);
      alert(`記録エラー: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 履歴からの削除処理
  const handleDeleteRecord = (id: string) => {
    const updated = allRecords.filter((r) => r.id !== id);
    setAllRecords(updated);
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated));

    const updated3Days = calculate3DaysConsumed(updated);
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
          {/* カレンダー履歴ボタン */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium active:scale-95 transition-all"
            title="過去の記録をカレンダーで確認"
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>履歴</span>
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
            不足栄養素と提案（直近3日間）
          </h2>
          <RecommendationView data={recommendations} isLoading={false} />
        </section>
      </div>

      {/* 食事記録直後の栄養素プレビューモーダル */}
      <MealNutrientModal
        record={lastRecordedItem}
        onClose={() => setLastRecordedItem(null)}
      />

      {/* カレンダー履歴閲覧モーダル */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        records={allRecords}
        onDeleteRecord={handleDeleteRecord}
      />
    </main>
  );
}
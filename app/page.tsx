"use client";

import React, { useState, useEffect } from "react";
import { MealInput } from "@/components/MealInput";
import { RecommendationView } from "@/components/RecommendationView";
import { MealNutrientModal } from "@/components/MealNutrientModal";
import { HistoryModal } from "@/components/HistoryModal";
import { BackupModal } from "@/components/BackupModal";
import { NutrientTargets, MealRecord } from "@/types/nutrition";
import { AlertCircle, Calendar, Database } from "lucide-react";

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

// 全14栄養素（各3アイテムの食材提案マスター）
const NUTRIENT_FOOD_PROPOSALS: Record<
  string,
  { food: string; base_unit: string; base_amount: number; reason: string }[]
> = {
  protein_g: [
    { food: "鶏むね肉", base_unit: "100g", base_amount: 23.3, reason: "高タンパク・低脂質な定番食材です。" },
    { food: "ゆで卵", base_unit: "1個(50g)", base_amount: 6.3, reason: "手軽に摂れる良質なタンパク質源です。" },
    { food: "納豆", base_unit: "1パック(50g)", base_amount: 8.3, reason: "植物性タンパク質と食物繊維を同時に摂取できます。" },
  ],
  fat_g: [
    { food: "素焼きアーモンド", base_unit: "10粒(10g)", base_amount: 5.4, reason: "抗酸化作用のあるビタミンEと良質な脂質を含みます。" },
    { food: "アボカド", base_unit: "半個(75g)", base_amount: 13.3, reason: "オレイン酸など不飽和脂肪酸が豊富です。" },
    { food: "オリーブオイル", base_unit: "大さじ1(12g)", base_amount: 12.0, reason: "ドレッシングなどで手軽に摂取できます。" },
  ],
  carbs_g: [
    { food: "玄米ごはん", base_unit: "1杯(150g)", base_amount: 53.4, reason: "血糖値の上昇が緩やかな炭水化物源です。" },
    { food: "オートミール", base_unit: "1食(30g)", base_amount: 20.7, reason: "食物繊維と炭水化物を効率よく摂取できます。" },
    { food: "さつまいも", base_unit: "1本(150g)", base_amount: 47.7, reason: "ビタミンや食物繊維も豊富に含まれます。" },
  ],
  fiber_g: [
    { food: "ごぼう", base_unit: "100g", base_amount: 5.7, reason: "水溶性・不溶性両方の食物繊維が豊富です。" },
    { food: "カット乾燥わかめ", base_unit: "大さじ1(3g)", base_amount: 1.1, reason: "汁物やサラダに手軽に追加できます。" },
    { food: "オートミール", base_unit: "1食(30g)", base_amount: 2.8, reason: "水溶性食物繊維βグルカンを含みます。" },
  ],
  vitamin_a_ug: [
    { food: "にんじん", base_unit: "半本(50g)", base_amount: 360, reason: "皮膚や粘膜を維持するβカロテンが豊富です。" },
    { food: "ほうれん草", base_unit: "1株(30g)", base_amount: 162, reason: "緑黄色野菜の代表格でβカロテンを含みます。" },
    { food: "かぼちゃ", base_unit: "1小鉢(80g)", base_amount: 264, reason: "甘みがあり料理に取り入れやすい野菜です。" },
  ],
  vitamin_b1_mg: [
    { food: "豚ヒレ肉", base_unit: "100g", base_amount: 1.32, reason: "糖質をエネルギーに変える代謝をサポートします。" },
    { food: "納豆", base_unit: "1パック(50g)", base_amount: 0.04, reason: "手軽にビタミンB群を補給できます。" },
    { food: "玄米ごはん", base_unit: "1杯(150g)", base_amount: 0.24, reason: "白米に比べビタミンB1が多く含まれます。" },
  ],
  vitamin_b2_mg: [
    { food: "納豆", base_unit: "1パック(50g)", base_amount: 0.28, reason: "脂質代謝を促し皮膚の健康維持を助けます。" },
    { food: "鶏卵", base_unit: "1個(50g)", base_amount: 0.22, reason: "毎日の食事で取り入れやすい食材です。" },
    { food: "豚レバー", base_unit: "50g", base_amount: 1.8, reason: "ビタミンB2が極めて豊富に含まれます。" },
  ],
  vitamin_c_mg: [
    { food: "キウイフルーツ", base_unit: "1個(100g)", base_amount: 71, reason: "生のまま手軽にビタミンCを補給できます。" },
    { food: "ブロッコリー", base_unit: "小皿1杯(70g)", base_amount: 84, reason: "加熱してもビタミンCが多く残ります。" },
    { food: "赤パプリカ", base_unit: "1/2個(80g)", base_amount: 136, reason: "ビタミンC含有量がトップクラスの野菜です。" },
  ],
  vitamin_d_ug: [
    { food: "鮭", base_unit: "1切れ(100g)", base_amount: 32, reason: "カルシウム吸収を助けるビタミンDが豊富です。" },
    { food: "さんま", base_unit: "1尾(100g)", base_amount: 15, reason: "良質な脂質とビタミンDを同時に摂れます。" },
    { food: "干し椎茸", base_unit: "2個(6g)", base_amount: 1.0, reason: "日光に当てることでビタミンDが増加します。" },
  ],
  calcium_mg: [
    { food: "木綿豆腐", base_unit: "1/2丁(150g)", base_amount: 130, reason: "骨や歯のサポートに貢献するカルシウム源です。" },
    { food: "しらす干し", base_unit: "大さじ2(15g)", base_amount: 31, reason: "丸ごと食べられる手軽なカルシウム源です。" },
    { food: "プレーンヨーグルト", base_unit: "1カップ(100g)", base_amount: 120, reason: "吸収率の高い乳製品由来カルシウムです。" },
  ],
  iron_mg: [
    { food: "小松菜", base_unit: "1株(50g)", base_amount: 1.4, reason: "植物性非ヘム鉄とビタミンCを含みます。" },
    { food: "豚レバー", base_unit: "50g", base_amount: 6.5, reason: "吸収率の高いヘム鉄が豊富に含まれます。" },
    { food: "あさり水煮缶", base_unit: "1缶(50g)", base_amount: 15, reason: "料理に手軽に使える鉄分源です。" },
  ],
  zinc_mg: [
    { food: "牛もも赤身肉", base_unit: "100g", base_amount: 4.2, reason: "新陳代謝や味覚維持に必要な亜鉛を含みます。" },
    { food: "牡蠣", base_unit: "3個(50g)", base_amount: 7.2, reason: "亜鉛含有量が非常に高い食材です。" },
    { food: "ミックスナッツ", base_unit: "1握り(20g)", base_amount: 0.7, reason: "間食感覚で補給できます。" },
  ],
  potassium_mg: [
    { food: "バナナ", base_unit: "1本(100g)", base_amount: 360, reason: "塩分排出を促すカリウムが手軽に摂れます。" },
    { food: "アボカド", base_unit: "半個(75g)", base_amount: 540, reason: "果物・野菜類の中でトップクラスの含有量です。" },
    { food: "ほうれん草", base_unit: "1小鉢(70g)", base_amount: 483, reason: "おひたしやスープで効率よく摂取できます。" },
  ],
  magnesium_mg: [
    { food: "素焼きアーモンド", base_unit: "10粒(12g)", base_amount: 37, reason: "代謝や神経伝達を助けるマグネシウム源です。" },
    { food: "木綿豆腐", base_unit: "1/2丁(150g)", base_amount: 86, reason: "日常の食事に取り入れやすい大豆食品です。" },
    { food: "純ココア", base_unit: "スプーン1杯(6g)", base_amount: 26, reason: "飲み物に混ぜて手軽に補給できます。" },
  ],
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
  const [isBackupOpen, setIsBackupOpen] = useState(false);
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
      const proposals = NUTRIENT_FOOD_PROPOSALS[key] || [];

      nutrientList.push({
        key,
        nutrient: NUTRIENT_LABELS[key]?.name || key,
        consumed: Math.round(actual * 10) / 10,
        target: Math.round(target3Days * 10) / 10,
        unit: NUTRIENT_LABELS[key]?.unit || "",
        gap: isShortage ? Math.round(gap * 10) / 10 : 0,
        proposals: proposals,
      });

      if (isShortage) {
        shortageNames.push(NUTRIENT_LABELS[key]?.name || key);
      }
    }

    const advice =
      shortageNames.length === 0
        ? "直近3日間の主要な栄養素はすべて充足されています。良好なバランスです。"
        : `直近3日間で特に「${shortageNames.slice(0, 3).join("・")}」が不足しています。各カードをタップして補給食材と目安量を確認できます。`;

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
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium active:scale-95 transition-all"
              title="履歴カレンダー"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>履歴</span>
            </button>
            <button
              onClick={() => setIsBackupOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium active:scale-95 transition-all"
              title="バックアップ管理"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>データ</span>
            </button>
          </div>
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
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        records={allRecords}
        onImportRecords={handleImportRecords}
      />
    </main>
  );
}
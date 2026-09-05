"use client";

import React from "react";
import { MealRecord, NutrientTargets } from "@/types/nutrition";
import { CheckCircle2, X, Flame, ShieldCheck } from "lucide-react";

interface Props {
  record: MealRecord | null;
  onClose: () => void;
}

const NUTRIENT_ITEMS: { key: keyof NutrientTargets; label: string; unit: string }[] = [
  { key: "calories_kcal", label: "エネルギー", unit: "kcal" },
  { key: "protein_g", label: "タンパク質", unit: "g" },
  { key: "fat_g", label: "脂質", unit: "g" },
  { key: "carbs_g", label: "炭水化物", unit: "g" },
  { key: "fiber_g", label: "食物繊維", unit: "g" },
  { key: "salt_equivalent_g", label: "食塩相当量", unit: "g" },
  { key: "vitamin_a_ug", label: "ビタミンA", unit: "μg" },
  { key: "vitamin_b1_mg", label: "ビタミンB1", unit: "mg" },
  { key: "vitamin_b2_mg", label: "ビタミンB2", unit: "mg" },
  { key: "vitamin_c_mg", label: "ビタミンC", unit: "mg" },
  { key: "calcium_mg", label: "カルシウム", unit: "mg" },
  { key: "iron_mg", label: "鉄分", unit: "mg" },
  { key: "zinc_mg", label: "亜鉛", unit: "mg" },
  { key: "potassium_mg", label: "カリウム", unit: "mg" },
  { key: "magnesium_mg", label: "マグネシウム", unit: "mg" },
];

export function MealNutrientModal({ record, onClose }: Props) {
  if (!record) return null;

  const n = record.nutrients;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-xl animate-in slide-in-from-bottom duration-200">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-gray-900">記録した食事の栄養価</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 食事サマリー */}
        <div className="p-4 overflow-y-auto space-y-4">
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3">
            <div className="text-[11px] text-emerald-800 font-medium mb-1">
              記録日時: {new Date(record.consumedAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="text-xs font-bold text-emerald-950 leading-relaxed">
              {record.mealSummary}
            </div>
          </div>

          {/* PFC ハイライト */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-orange-600 font-semibold">タンパク質</div>
              <div className="text-sm font-bold text-orange-950 mt-0.5">{Math.round(n.protein_g * 10) / 10}g</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-yellow-600 font-semibold">脂質</div>
              <div className="text-sm font-bold text-yellow-950 mt-0.5">{Math.round(n.fat_g * 10) / 10}g</div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-blue-600 font-semibold">炭水化物</div>
              <div className="text-sm font-bold text-blue-950 mt-0.5">{Math.round(n.carbs_g * 10) / 10}g</div>
            </div>
          </div>

          {/* 栄養素グリッド一覧 */}
          <div>
            <div className="text-[11px] font-bold text-gray-500 mb-2 px-1">摂取栄養素の内訳</div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {NUTRIENT_ITEMS.map((item) => {
                const val = n[item.key] || 0;
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-100"
                  >
                    <span className="text-gray-600 text-[11px]">{item.label}</span>
                    <span className="font-semibold text-gray-800 text-[11px]">
                      {Math.round(val * 10) / 10} {item.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            確認して全体の栄養バランスを見る
          </button>
        </div>
      </div>
    </div>
  );
}
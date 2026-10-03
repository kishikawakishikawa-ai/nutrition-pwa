"use client";

import React from "react";
import { X, Utensils } from "lucide-react";
import { MealRecord } from "@/types/nutrition";

interface MealNutrientModalProps {
  isOpen: boolean;
  onClose: () => void;
  record?: MealRecord | null;
  meal?: MealRecord | null;
  onDelete?: (id: string) => void;
}

export const MealNutrientModal: React.FC<MealNutrientModalProps> = ({
  isOpen,
  onClose,
  record,
  meal,
  onDelete,
}) => {
  if (!isOpen) return null;

  const currentMeal = record || meal;
  if (!currentMeal) return null;

  const n: Record<string, any> = currentMeal.nutrients || {};

  const getVal = (keys: string[]): number => {
    for (const k of keys) {
      if (n[k] !== undefined && n[k] !== null) {
        const val = Number(n[k]);
        if (!isNaN(val)) return val;
      }
    }
    return 0;
  };

  const calories = getVal(["calories", "エネルギー", "calories_kcal"]);
  const protein = getVal(["protein", "protein_g", "タンパク質"]);
  const fat = getVal(["fat", "fat_g", "脂質"]);
  const carbs = getVal(["carbs", "carbs_g", "炭水化物"]);

  const titleText =
    currentMeal.foodText || currentMeal.rawText || currentMeal.text || "食事の記録";
  const rawDate = currentMeal.timestamp || currentMeal.createdAt || currentMeal.date;
  const dateStr = rawDate ? new Date(rawDate).toLocaleString("ja-JP") : "";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-900">食事の栄養詳細</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {dateStr && <div className="text-xs text-gray-500">{dateStr}</div>}

        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs font-medium text-gray-800">
          {titleText}
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-500">主要栄養素</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
              <span className="text-amber-700 block text-[10px]">エネルギー</span>
              <span className="text-sm font-bold text-amber-900">
                {Math.round(calories)} kcal
              </span>
            </div>
            <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
              <span className="text-blue-700 block text-[10px]">タンパク質</span>
              <span className="text-sm font-bold text-blue-900">
                {Math.round(protein * 10) / 10} g
              </span>
            </div>
            <div className="bg-red-50 p-2.5 rounded-xl border border-red-100">
              <span className="text-red-700 block text-[10px]">脂質</span>
              <span className="text-sm font-bold text-red-900">
                {Math.round(fat * 10) / 10} g
              </span>
            </div>
            <div className="bg-green-50 p-2.5 rounded-xl border border-green-100">
              <span className="text-green-700 block text-[10px]">炭水化物</span>
              <span className="text-sm font-bold text-green-900">
                {Math.round(carbs * 10) / 10} g
              </span>
            </div>
          </div>
        </div>

        {Object.keys(n).length > 0 && (
          <div className="max-h-40 overflow-y-auto space-y-1 pt-2 border-t border-gray-100">
            <div className="text-[11px] font-bold text-gray-400 mb-1">
              全栄養成分データ
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {Object.entries(n).map(([key, val]) => {
                const num = typeof val === "number" ? val : parseFloat(val as string);
                if (isNaN(num)) return null;
                return (
                  <div
                    key={key}
                    className="flex justify-between bg-gray-50 px-2 py-1 rounded border border-gray-100"
                  >
                    <span className="text-gray-500">{key}</span>
                    <span className="font-semibold text-gray-800">
                      {Math.round(num * 10) / 10}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {onDelete && (
            <button
              onClick={() => {
                if (confirm("この記録を削除しますか？")) {
                  onDelete(currentMeal.id);
                  onClose();
                }
              }}
              className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 transition-all"
            >
              削除
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-all"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
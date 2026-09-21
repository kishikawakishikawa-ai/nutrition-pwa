"use client";

import React, { useState } from "react";
import { Sparkles, AlertCircle, Utensils, X, ChevronRight } from "lucide-react";

export interface FoodProposalItem {
  food: string;
  base_unit: string;
  base_amount: number;
  reason: string;
}

interface NutrientItem {
  key?: string;
  nutrient: string;
  consumed: number;
  target: number;
  unit: string;
  gap: number;
  proposals?: FoodProposalItem[];
}

interface RecommendationData {
  advice?: string;
  nutrients?: NutrientItem[];
}

interface RecommendationViewProps {
  data: RecommendationData | null | undefined;
  isLoading: boolean;
}

function formatRequiredAmount(gap: number, baseAmount: number, baseUnit: string): string {
  if (!baseAmount || baseAmount <= 0) return "";
  const ratio = gap / baseAmount;

  if (
    baseUnit === "100g" ||
    baseUnit === "50g" ||
    baseUnit === "30g" ||
    baseUnit === "80g" ||
    baseUnit === "70g"
  ) {
    const baseGrams = parseInt(baseUnit);
    return `約 ${Math.round(ratio * baseGrams)}g`;
  }
  if (baseUnit.includes("本")) {
    const count = Math.round(ratio * 10) / 10;
    return `約 ${count}本`;
  }
  if (baseUnit.includes("パック")) {
    const count = Math.round(ratio * 10) / 10;
    return `約 ${count}パック`;
  }
  if (baseUnit.includes("個")) {
    const count = Math.round(ratio * 10) / 10;
    return `約 ${count}個`;
  }
  if (baseUnit.includes("切れ")) {
    const count = Math.round(ratio * 10) / 10;
    return `約 ${count}切れ`;
  }
  if (baseUnit.includes("尾")) {
    const count = Math.round(ratio * 10) / 10;
    return `約 ${count}尾`;
  }
  if (baseUnit.includes("株")) {
    const count = Math.round(ratio * 10) / 10;
    return `約 ${count}株`;
  }
  if (baseUnit.includes("粒")) {
    const count = Math.round(ratio * 10);
    return `約 ${count}粒`;
  }
  if (baseUnit.includes("丁")) {
    const count = Math.round(ratio * 10) / 10;
    return `約 ${count}丁`;
  }
  if (baseUnit.includes("杯")) {
    const count = Math.round(ratio * 10) / 10;
    return `約 ${count}杯`;
  }
  if (baseUnit.includes("缶")) {
    const count = Math.round(ratio * 10) / 10;
    return `約 ${count}缶`;
  }
  if (baseUnit.includes("握り")) {
    const count = Math.round(ratio * 10) / 10;
    return `約 ${count}握り`;
  }
  return `約 ${Math.round(ratio * 10) / 10} 回分 (${baseUnit})`;
}

export const RecommendationView: React.FC<RecommendationViewProps> = ({
  data,
  isLoading,
}) => {
  const [selectedNutrient, setSelectedNutrient] = useState<NutrientItem | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/80 text-center">
        <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-gray-500 font-medium">3日間の栄養バランスを解析中...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/80 text-center">
        <p className="text-xs text-gray-500">
          食事が記録されると、直近3日間の栄養素ステータスがここに表示されます。
        </p>
      </div>
    );
  }

  const adviceText = data.advice || "直近3日間の栄養バランスに基づく提案です。";
  const items = Array.isArray(data.nutrients) ? data.nutrients : [];

  return (
    <div className="space-y-4">
      {/* 総合アドバイス */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/80 space-y-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <h3 className="text-xs font-bold text-gray-800 tracking-wide uppercase">
            直近3日間の栄養分析
          </h3>
        </div>
        <p className="text-xs text-gray-700 leading-relaxed">{adviceText}</p>
      </div>

      {/* 栄養素カード一覧 */}
      {items.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <h3 className="text-xs font-bold text-gray-800 tracking-wide uppercase">
                栄養素の摂取状況
              </h3>
            </div>
            <span className="text-[10px] text-gray-500">
              充足: {items.filter((i) => i.gap <= 0).length} / {items.length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {items.map((item, idx) => {
              const isShortage = item.gap > 0;
              const fulfillmentRate =
                item.target > 0
                  ? Math.round((item.consumed / item.target) * 100)
                  : 0;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedNutrient(item)}
                  className={`text-left rounded-xl p-2.5 space-y-1 border transition-all active:scale-[0.98] ${
                    isShortage
                      ? "bg-amber-50/60 border-amber-200/80 hover:bg-amber-100/50"
                      : "bg-emerald-50/50 border-emerald-200/70 hover:bg-emerald-100/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-0.5">
                      {item.nutrient}
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    </span>
                    {!isShortage && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                        達成
                      </span>
                    )}
                  </div>

                  {/* 充足率表示 */}
                  <div
                    className={`text-xs font-bold ${
                      isShortage ? "text-amber-700" : "text-emerald-700"
                    }`}
                  >
                    充足率: {fulfillmentRate}%
                  </div>

                  <div className="text-[10px] text-gray-500">
                    摂取 {item.consumed} / 目標 {item.target} {item.unit}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* カードタップ時の小窓（モーダル） */}
      {selectedNutrient && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-2xl p-5 shadow-xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 flex-shrink-0">
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  <span>{selectedNutrient.nutrient} の補給目安</span>
                </h4>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  直近3日: 摂取 {selectedNutrient.consumed} / 目標 {selectedNutrient.target} {selectedNutrient.unit}
                </div>
              </div>
              <button
                onClick={() => setSelectedNutrient(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 不足量ステータス */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {selectedNutrient.gap > 0 ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">
                  不足量: {selectedNutrient.gap} {selectedNutrient.unit}
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  目標達成（現在充足しています）
                </span>
              )}
            </div>

            {/* おすすめ食材（3アイテム表示） */}
            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {selectedNutrient.proposals && selectedNutrient.proposals.length > 0 ? (
                selectedNutrient.proposals.map((prop, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 border border-gray-200/80 rounded-xl p-3 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800 text-sm">
                        {idx + 1}. {prop.food}
                      </span>
                    </div>

                    {selectedNutrient.gap > 0 && prop.base_amount > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg p-2 text-emerald-900 space-y-0.5">
                        <div className="text-[10px] text-emerald-700 font-medium">
                          不足分（{selectedNutrient.gap} {selectedNutrient.unit}）を補う必要目安量:
                        </div>
                        <div className="text-xs font-extrabold text-emerald-800">
                          {formatRequiredAmount(
                            selectedNutrient.gap,
                            prop.base_amount,
                            prop.base_unit
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-gray-600 text-[11px] leading-relaxed">
                      {prop.reason}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">
                  バランスの良い食事を意識してください。
                </p>
              )}
            </div>

            <button
              onClick={() => setSelectedNutrient(null)}
              className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition-all flex-shrink-0"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
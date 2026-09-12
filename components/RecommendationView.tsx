"use client";

import React, { useState } from "react";
import { Sparkles, AlertCircle, Utensils, X, ChevronRight } from "lucide-react";

interface NutrientItem {
  key?: string;
  nutrient: string;
  consumed: number;
  target: number;
  unit: string;
  gap: number;
  proposal?: {
    food_name: string;
    portion: string;
    reason: string;
  } | null;
}

interface RecommendationData {
  advice?: string;
  nutrients?: NutrientItem[];
}

interface RecommendationViewProps {
  data: RecommendationData | null | undefined;
  isLoading: boolean;
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

      {/* 栄養素カード一覧（タップで小窓起動） */}
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
                        充足
                      </span>
                    )}
                  </div>

                  {isShortage && (
                    <div className="text-[11px] text-red-600 font-medium">
                      不足: {item.gap} {item.unit}
                    </div>
                  )}

                  <div className="text-[10px] text-gray-500">
                    摂取 {item.consumed} / 目標 {item.target} {item.unit}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* カードタップ時に表示される補給食材モーダル（小窓） */}
      {selectedNutrient && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-2xl p-5 shadow-xl animate-in slide-in-from-bottom duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
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

            {/* ステータスバッジ */}
            <div className="flex items-center gap-2">
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

            {/* おすすめ食材 */}
            {selectedNutrient.proposal ? (
              <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 text-sm">
                    {selectedNutrient.proposal.food_name}
                  </span>
                  <span className="text-[10px] font-medium bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-600">
                    目安: {selectedNutrient.proposal.portion}
                  </span>
                </div>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  {selectedNutrient.proposal.reason}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">
                バランスの良い主食・主菜・副菜を継続して摂取してください。
              </p>
            )}

            <button
              onClick={() => setSelectedNutrient(null)}
              className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-black active:scale-[0.99] transition-all"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
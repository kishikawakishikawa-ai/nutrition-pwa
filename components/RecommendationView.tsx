"use client";

import React from "react";
import { Sparkles, CheckCircle2, AlertCircle, Utensils } from "lucide-react";

interface NutrientItem {
  nutrient: string;
  consumed: number;
  target: number;
  unit: string;
  gap: number;
}

interface ProposalItem {
  food_name: string;
  portion: string;
  reason: string;
}

interface RecommendationData {
  advice?: string;
  nutrients?: NutrientItem[];
  shortages?: NutrientItem[];
  proposals?: ProposalItem[];
}

interface RecommendationViewProps {
  data: RecommendationData | null | undefined;
  isLoading: boolean;
}

export const RecommendationView: React.FC<RecommendationViewProps> = ({
  data,
  isLoading,
}) => {
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
          食事が記録されると、直近3日間の栄養素ステータスと改善提案がここに表示されます。
        </p>
      </div>
    );
  }

  const adviceText = data.advice || "直近3日間の栄養バランスに基づく提案です。";
  const items = Array.isArray(data.nutrients)
    ? data.nutrients
    : Array.isArray(data.shortages)
    ? data.shortages
    : [];
  const proposals = Array.isArray(data.proposals) ? data.proposals : [];

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

      {/* 栄養素一覧（充足しても消さずに表示） */}
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
                <div
                  key={idx}
                  className={`rounded-xl p-2.5 space-y-1 border transition-colors ${
                    isShortage
                      ? "bg-amber-50/50 border-amber-200/70"
                      : "bg-emerald-50/40 border-emerald-200/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">{item?.nutrient}</span>
                    {!isShortage && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                        充足
                      </span>
                    )}
                  </div>

                  {/* 不足している時だけ不足量の行を表示 */}
                  {isShortage && (
                    <div className="text-[11px] text-red-600 font-medium">
                      不足: {item?.gap} {item?.unit}
                    </div>
                  )}

                  {/* 摂取量は目標値を超えても積み上げた値を表示 */}
                  <div className="text-[10px] text-gray-500">
                    摂取 {item?.consumed} / 目標 {item?.target} {item?.unit}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* おすすめの補給食材 */}
      {proposals.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/80 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <h3 className="text-xs font-bold text-gray-800 tracking-wide uppercase">
              おすすめの補給食材
            </h3>
          </div>
          <div className="space-y-2">
            {proposals.map((prop: any, idx: number) => (
              <div
                key={idx}
                className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">{prop?.food_name}</span>
                  {prop?.portion && (
                    <span className="text-[10px] font-medium bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-600">
                      {prop.portion}
                    </span>
                  )}
                </div>
                {prop?.reason && <p className="text-[11px] text-gray-600 leading-snug">{prop.reason}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
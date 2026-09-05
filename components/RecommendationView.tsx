"use client";

import React from "react";
import { Sparkles, AlertCircle, Utensils } from "lucide-react";

interface ShortageItem {
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
  shortages?: ShortageItem[];
  proposals?: ProposalItem[];
  analysis?: string;
  recommendations?: any[];
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
          食事が記録されると、直近3日間の不足栄養素と改善提案がここに表示されます。
        </p>
      </div>
    );
  }

  // プロパティ名の不一致があってもフォールバックしてクラッシュを防ぐ
  const adviceText = data.advice || data.analysis || "直近3日間の栄養バランスに基づく提案です。";
  const shortages = Array.isArray(data.shortages) ? data.shortages : [];
  const proposals = Array.isArray(data.proposals)
    ? data.proposals
    : Array.isArray(data.recommendations)
    ? data.recommendations
    : [];

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

      {/* 不足している栄養素 */}
      {shortages.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/80 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <h3 className="text-xs font-bold text-gray-800 tracking-wide uppercase">
              不足している栄養素
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {shortages.map((item, idx) => (
              <div
                key={idx}
                className="bg-amber-50/50 border border-amber-100 rounded-xl p-2.5 space-y-1"
              >
                <div className="text-xs font-bold text-gray-800">{item?.nutrient}</div>
                <div className="text-[11px] text-amber-700 font-medium">
                  不足: {item?.gap} {item?.unit}
                </div>
                <div className="text-[10px] text-gray-500">
                  摂取 {item?.consumed} / 目標 {item?.target} {item?.unit}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 改善のためのおすすめ食材 */}
      {proposals.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/80 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <h3 className="text-xs font-bold text-gray-800 tracking-wide uppercase">
              おすすめの補給食材
            </h3>
          </div>
          <div className="space-y-2">
            {proposals.map((prop: any, idx: number) => {
              const name = prop?.food_name || prop?.food || prop?.name || "おすすめ食材";
              const portion = prop?.portion || prop?.quantity || "";
              const reason = prop?.reason || prop?.description || "";
              return (
                <div
                  key={idx}
                  className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">{name}</span>
                    {portion && (
                      <span className="text-[10px] font-medium bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-600">
                        {portion}
                      </span>
                    )}
                  </div>
                  {reason && <p className="text-[11px] text-gray-600 leading-snug">{reason}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
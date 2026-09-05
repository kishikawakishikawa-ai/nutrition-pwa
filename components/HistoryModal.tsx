"use client";

import React, { useState } from "react";
import { MealRecord } from "@/types/nutrition";
import { X, Calendar as CalendarIcon, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  records: MealRecord[];
  onDeleteRecord: (id: string) => void;
}

// 日付を "YYYY-MM-DD" 形式に変換
function formatDateToKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function HistoryModal({ isOpen, onClose, records, onDeleteRecord }: Props) {
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    formatDateToKey(new Date())
  );

  if (!isOpen) return null;

  // 選択日の前日・翌日に移動
  const changeDate = (days: number) => {
    const current = new Date(selectedDateStr);
    current.setDate(current.getDate() + days);
    setSelectedDateStr(formatDateToKey(current));
  };

  // 選択された日付の食事レコードを抽出（新しい時間順）
  const dayRecords = records.filter((r) => {
    if (!r?.consumedAt) return false;
    const itemDate = new Date(r.consumedAt);
    return formatDateToKey(itemDate) === selectedDateStr;
  }).sort((a, b) => new Date(b.consumedAt).getTime() - new Date(a.consumedAt).getTime());

  // 選択日の合計カロリー・PFC集計
  const dayTotal = dayRecords.reduce(
    (acc, r) => {
      acc.calories += r.nutrients?.calories_kcal || 0;
      acc.protein += r.nutrients?.protein_g || 0;
      acc.fat += r.nutrients?.fat_g || 0;
      acc.carbs += r.nutrients?.carbs_g || 0;
      return acc;
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl h-[85vh] flex flex-col shadow-xl animate-in slide-in-from-bottom duration-200">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-gray-900">食事の記録履歴</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 日付切り替えバー */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <button
            onClick={() => changeDate(-1)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-white active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDateStr}
              onChange={(e) => setSelectedDateStr(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={() => changeDate(1)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-white active:scale-95 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 選択日の合計値 */}
        <div className="px-4 py-2 bg-emerald-50/50 border-b border-emerald-100/60 flex items-center justify-between text-xs">
          <span className="text-[11px] font-medium text-emerald-800">1日の合計</span>
          <div className="flex gap-2.5 text-[11px] font-bold text-emerald-950">
            <span>{Math.round(dayTotal.calories)} kcal</span>
            <span>P: {Math.round(dayTotal.protein * 10) / 10}g</span>
            <span>F: {Math.round(dayTotal.fat * 10) / 10}g</span>
            <span>C: {Math.round(dayTotal.carbs * 10) / 10}g</span>
          </div>
        </div>

        {/* 食事履歴リスト */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {dayRecords.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-gray-400 text-xs">
              この日の食事記録はありません
            </div>
          ) : (
            dayRecords.map((item) => {
              const timeStr = new Date(item.consumedAt).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const cal = Math.round(item.nutrients?.calories_kcal || 0);
              const p = Math.round((item.nutrients?.protein_g || 0) * 10) / 10;
              const f = Math.round((item.nutrients?.fat_g || 0) * 10) / 10;
              const c = Math.round((item.nutrients?.carbs_g || 0) * 10) / 10;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200/80 rounded-xl p-3 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-gray-500 border-b border-gray-50 pb-1.5">
                    <span className="font-bold text-gray-700">{timeStr}</span>
                    <button
                      onClick={() => {
                        if (confirm("この記録を削除しますか？")) {
                          onDeleteRecord(item.id);
                        }
                      }}
                      className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-xs font-semibold text-gray-800 leading-snug">
                    {item.mealSummary}
                  </div>
                  <div className="flex items-center gap-2 pt-0.5 text-[10px] text-gray-500 font-medium">
                    <span className="text-gray-700 font-bold">{cal} kcal</span>
                    <span>P: {p}g</span>
                    <span>F: {f}g</span>
                    <span>C: {c}g</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
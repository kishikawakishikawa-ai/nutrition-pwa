"use client";

import React, { useState } from "react";
import { X, Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { MealRecord } from "@/types/nutrition";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: MealRecord[];
  onDeleteRecord: (id: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  records,
  onDeleteRecord,
}) => {
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  if (!isOpen) return null;

  // 日付文字列 (YYYY-MM-DD) に該当する記録を抽出
  const filteredRecords = records.filter((rec) => {
    if (!rec.consumedAt) return false;
    const dateStr = new Date(rec.consumedAt).toISOString().split("T")[0];
    return dateStr === selectedDateStr;
  });

  const handleDateChange = (days: number) => {
    const current = new Date(selectedDateStr);
    current.setDate(current.getDate() + days);
    setSelectedDateStr(current.toISOString().split("T")[0]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-900">食事履歴カレンダー</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* カレンダー日付選択バー */}
        <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-2.5 mb-3 flex items-center justify-between">
          <button
            onClick={() => handleDateChange(-1)}
            className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDateStr}
              onChange={(e) => setSelectedDateStr(e.target.value)}
              className="bg-white border border-gray-300 text-gray-800 text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={() => handleDateChange(1)}
            className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 選択日の件数 */}
        <div className="text-[11px] font-semibold text-gray-500 px-1 mb-2">
          {selectedDateStr} の記録: {filteredRecords.length}件
        </div>

        {/* 履歴一覧 */}
        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {filteredRecords.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-8">
              この日付の食事記録はありません
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const timeStr = rec.consumedAt
                ? new Date(rec.consumedAt).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";

              return (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-gray-800">
                      {rec.mealSummary || rec.inputText}
                    </div>
                    <div className="text-[10px] text-gray-400">{timeStr}</div>
                  </div>
                  <button
                    onClick={() => onDeleteRecord(rec.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition-all"
        >
          閉じる
        </button>
      </div>
    </div>
  );
};
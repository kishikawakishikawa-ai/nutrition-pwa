"use client";

import React, { useState } from "react";
import { X, Calendar, ChevronRight, Utensils } from "lucide-react";
import { MealRecord } from "@/types/nutrition";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: MealRecord[];
  onDeleteRecord?: (id: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  records,
  onDeleteRecord,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<MealRecord | null>(null);

  if (!isOpen) return null;

  // 日付の取得処理ヘルパー
  const getRecordDate = (rec: MealRecord): Date => {
    const rawDate = rec.timestamp || rec.createdAt || rec.date;
    if (!rawDate) return new Date();
    return new Date(rawDate);
  };

  // 日付順（新しい順）に並べ替え
  const sortedRecords = [...records].sort(
    (a, b) => getRecordDate(b).getTime() - getRecordDate(a).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md h-[85vh] sm:h-[75vh] rounded-t-3xl sm:rounded-2xl p-5 shadow-xl flex flex-col space-y-4 animate-in slide-in-from-bottom duration-200">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-gray-900">食事記録履歴</h3>
            <span className="text-xs text-gray-500">（全{records.length}件）</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 履歴リスト（付箋カード一覧） */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {sortedRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              記録がありません
            </div>
          ) : (
            sortedRecords.map((rec) => {
              const dateObj = getRecordDate(rec);
              const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${String(
                dateObj.getHours()
              ).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`;

              const nutrients = (rec.nutrients || {}) as Record<string, any>;
              const calories =
                nutrients.calories ?? nutrients.エネルギー ?? nutrients.calories_kcal ?? 0;
              const protein =
                nutrients.protein ?? nutrients.protein_g ?? nutrients.タンパク質 ?? 0;

              const displayText =
                rec.foodText || rec.rawText || rec.text || "食事内容の記録";

              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecord(rec)}
                  className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-3.5 shadow-sm hover:shadow-md active:scale-[0.99] transition-all cursor-pointer relative group"
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                      {dateStr}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-amber-700 font-medium">
                      <span>{Math.round(Number(calories) || 0)} kcal</span>
                      <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  <p className="text-xs text-gray-800 font-medium line-clamp-2 leading-relaxed">
                    {displayText}
                  </p>

                  {Number(protein) > 0 && (
                    <div className="mt-2 pt-2 border-t border-amber-200/40 flex items-center justify-between text-[11px] text-gray-600">
                      <span>タンパク質: {Math.round((Number(protein) || 0) * 10) / 10}g</span>
                      <span className="text-[10px] text-amber-600">タップして詳細表示</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-all flex-shrink-0"
        >
          閉じる
        </button>
      </div>

      {/* 選択した記録の栄養素詳細ポップアップ */}
      {selectedRecord && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[80vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold mb-0.5">
                  <Utensils className="w-3.5 h-3.5" />
                  <span>
                    {getRecordDate(selectedRecord).toLocaleString("ja-JP", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-gray-900 leading-snug">
                  摂取栄養素の詳細
                </h4>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-700 leading-relaxed font-medium">
                {selectedRecord.foodText ||
                  selectedRecord.rawText ||
                  selectedRecord.text ||
                  "食事内容の記録"}
              </p>
            </div>

            {/* 栄養素テーブル */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              <div className="text-xs font-bold text-gray-500 mb-2">栄養成分一覧</div>
              {selectedRecord.nutrients &&
              Object.keys(selectedRecord.nutrients).length > 0 ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(selectedRecord.nutrients).map(([key, val]) => {
                    const valueNum = typeof val === "number" ? val : parseFloat(val as string);
                    if (isNaN(valueNum)) return null;

                    return (
                      <div
                        key={key}
                        className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100"
                      >
                        <span className="text-gray-600 font-medium">{key}</span>
                        <span className="font-bold text-gray-900">
                          {Math.round(valueNum * 10) / 10}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-gray-400 py-4 text-center">
                  詳細な栄養データがありません
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              {onDeleteRecord && (
                <button
                  onClick={() => {
                    if (confirm("この記録を削除しますか？")) {
                      onDeleteRecord(selectedRecord.id);
                      setSelectedRecord(null);
                    }
                  }}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 transition-all"
                >
                  削除
                </button>
              )}
              <button
                onClick={() => setSelectedRecord(null)}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-all"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
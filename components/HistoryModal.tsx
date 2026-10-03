"use client";

import React, { useState } from "react";
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronRight as ArrowRight, Utensils } from "lucide-react";
import { MealRecord } from "@/types/nutrition";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: MealRecord[];
  onDeleteRecord?: (id: string) => void;
}

// 栄養素キーの日本語名および単位の対応マップ
const NUTRIENT_NAME_MAP: Record<string, { name: string; unit: string }> = {
  calories_kcal: { name: "エネルギー", unit: "kcal" },
  calories: { name: "エネルギー", unit: "kcal" },
  エネルギー: { name: "エネルギー", unit: "kcal" },
  protein_g: { name: "タンパク質", unit: "g" },
  protein: { name: "タンパク質", unit: "g" },
  タンパク質: { name: "タンパク質", unit: "g" },
  fat_g: { name: "脂質", unit: "g" },
  fat: { name: "脂質", unit: "g" },
  脂質: { name: "脂質", unit: "g" },
  carbs_g: { name: "炭水化物", unit: "g" },
  carbs: { name: "炭水化物", unit: "g" },
  炭水化物: { name: "炭水化物", unit: "g" },
  fiber_g: { name: "食物繊維", unit: "g" },
  fiber: { name: "食物繊維", unit: "g" },
  食物繊維: { name: "食物繊維", unit: "g" },
  salt_equivalent_g: { name: "食塩相当量", unit: "g" },
  salt_g: { name: "食塩相当量", unit: "g" },
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

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  records,
  onDeleteRecord,
}) => {
  // 今日の日付 (YYYY-MM-DD) を初期値として保持
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedRecord, setSelectedRecord] = useState<MealRecord | null>(null);

  if (!isOpen) return null;

  // 記録の日時を Date オブジェクトで取得する関数
  const getRecordDate = (rec: MealRecord): Date => {
    const ts = rec.consumedAt || rec.timestamp || rec.createdAt || rec.date;
    if (!ts) return new Date();
    return new Date(ts);
  };

  // 食事内容テキストを確実に取得する関数
  const getRecordText = (rec: MealRecord): string => {
    return (
      rec.mealSummary ||
      rec.inputText ||
      rec.foodText ||
      rec.rawText ||
      rec.text ||
      "食事内容の記録"
    );
  };

  // 栄養素の数値を安全に取得する関数
  const getNutrientVal = (nutrients: any, keys: string[]): number => {
    if (!nutrients) return 0;
    for (const key of keys) {
      if (nutrients[key] !== undefined && nutrients[key] !== null) {
        const val = Number(nutrients[key]);
        if (!isNaN(val)) return val;
      }
    }
    return 0;
  };

  // 日付の切り替え操作
  const handleDateChange = (days: number) => {
    const current = new Date(selectedDateStr);
    current.setDate(current.getDate() + days);
    setSelectedDateStr(current.toISOString().split("T")[0]);
  };

  // 選択日の記録のみを抽出（時間順：新しい順）
  const filteredRecords = records
    .filter((rec) => {
      const recDate = getRecordDate(rec);
      const year = recDate.getFullYear();
      const month = String(recDate.getMonth() + 1).padStart(2, "0");
      const day = String(recDate.getDate()).padStart(2, "0");
      const formattedRecDate = `${year}-${month}-${day}`;
      return formattedRecDate === selectedDateStr;
    })
    .sort((a, b) => getRecordDate(b).getTime() - getRecordDate(a).getTime());

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md h-[85vh] sm:h-[75vh] rounded-t-3xl sm:rounded-2xl p-5 shadow-xl flex flex-col space-y-3 animate-in slide-in-from-bottom duration-200">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-gray-900">食事履歴カレンダー</h3>
            <span className="text-xs text-gray-500">（全{records.length}件）</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 日付選択バー */}
        <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-2 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={() => handleDateChange(-1)}
            className="p-1.5 text-gray-600 hover:bg-gray-200/70 rounded-lg active:scale-95 transition-all"
            title="前日"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={selectedDateStr}
              onChange={(e) => setSelectedDateStr(e.target.value)}
              className="bg-white border border-gray-300 text-gray-800 text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            type="button"
            onClick={() => handleDateChange(1)}
            className="p-1.5 text-gray-600 hover:bg-gray-200/70 rounded-lg active:scale-95 transition-all"
            title="翌日"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="text-[11px] font-semibold text-gray-500 px-1 flex justify-between items-center flex-shrink-0">
          <span>{selectedDateStr} の記録</span>
          <span>{filteredRecords.length}件</span>
        </div>

        {/* 1日分の履歴リスト（付箋カード一覧） */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              この日付の食事記録はありません
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const dateObj = getRecordDate(rec);
              const timeStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${String(
                dateObj.getHours()
              ).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`;

              const calories = getNutrientVal(rec.nutrients, ["calories", "エネルギー", "calories_kcal"]);
              const protein = getNutrientVal(rec.nutrients, ["protein", "protein_g", "タンパク質"]);

              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecord(rec)}
                  className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-3.5 shadow-sm hover:shadow-md active:scale-[0.99] transition-all cursor-pointer relative group"
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                      {timeStr}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-amber-700 font-medium">
                      <span>{Math.round(calories)} kcal</span>
                      <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  <p className="text-xs text-gray-800 font-medium line-clamp-2 leading-relaxed">
                    {getRecordText(rec)}
                  </p>

                  {protein > 0 && (
                    <div className="mt-2 pt-2 border-t border-amber-200/40 flex items-center justify-between text-[11px] text-gray-600">
                      <span>タンパク質: {Math.round(protein * 10) / 10}g</span>
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
                {getRecordText(selectedRecord)}
              </p>
            </div>

            {/* 栄養素テーブル（日本語変換表示） */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              <div className="text-xs font-bold text-gray-500 mb-2">栄養成分一覧</div>
              {selectedRecord.nutrients &&
              Object.keys(selectedRecord.nutrients).length > 0 ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(selectedRecord.nutrients).map(([key, val]) => {
                    const valueNum = typeof val === "number" ? val : parseFloat(val);
                    if (isNaN(valueNum)) return null;

                    const mapped = NUTRIENT_NAME_MAP[key] || { name: key, unit: "" };

                    return (
                      <div
                        key={key}
                        className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100"
                      >
                        <span className="text-gray-600 font-medium">{mapped.name}</span>
                        <span className="font-bold text-gray-900">
                          {Math.round(valueNum * 10) / 10} {mapped.unit}
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
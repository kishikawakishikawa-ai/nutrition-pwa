"use client";

import React, { useRef } from "react";
import { X, Trash2, Calendar, Download, Upload } from "lucide-react";
import { MealRecord } from "@/types/nutrition";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: MealRecord[];
  onDeleteRecord: (id: string) => void;
  onImportRecords?: (importedRecords: MealRecord[]) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  records,
  onDeleteRecord,
  onImportRecords,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // JSONエクスポート処理
  const handleExport = () => {
    if (records.length === 0) {
      alert("保存されている記録がありません。");
      return;
    }
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nutrition_backup_${today}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // JSONインポート処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!Array.isArray(parsed)) {
          alert("フォーマットが正しくありません。配列形式のJSONファイルを指定してください。");
          return;
        }

        if (onImportRecords) {
          onImportRecords(parsed);
          alert(`${parsed.length} 件の記録をインポートしました。`);
        }
      } catch (err) {
        alert("JSONファイルの読み込みに失敗しました。正しいファイル形式か確認してください。");
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-900">食事記録・データ管理</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* バックアップ操作セクション */}
        <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3 mb-3 space-y-2">
          <div className="text-[11px] font-semibold text-gray-700">データバックアップ (JSON)</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-gray-600" />
              <span>エクスポート</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-gray-600" />
              <span>インポート</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* 履歴一覧 */}
        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {records.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-8">保存された記録はありません</p>
          ) : (
            records.map((rec) => {
              const dateStr = rec.consumedAt
                ? new Date(rec.consumedAt).toLocaleString("ja-JP", {
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "日時不明";

              return (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-gray-800">{rec.mealSummary || rec.inputText}</div>
                    <div className="text-[10px] text-gray-400">{dateStr}</div>
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
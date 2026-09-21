"use client";

import React, { useRef, useState } from "react";
import { X, Download, Upload, Database, Copy, Check } from "lucide-react";
import { MealRecord } from "@/types/nutrition";

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: MealRecord[];
  onImportRecords: (importedRecords: MealRecord[]) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  records,
  onImportRecords,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (records.length === 0) {
      alert("保存されている記録がありません。");
      return;
    }

    try {
      const jsonStr = JSON.stringify(records, null, 2);
      const today = new Date().toISOString().split("T")[0];
      const filename = `nutrition_backup_${today}.json`;
      const file = new File([jsonStr], filename, { type: "application/json" });

      // iOS/Web Share API 対応（共有ダイアログ経由で「"ファイル"に保存」を呼び出す）
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "食事記録バックアップ",
        });
        return;
      }

      // フォールバック: ブラウザ直接ダウンロード
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = url;
      downloadAnchor.download = filename;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      // ユーザーによる共有キャンセルの場合は警告を出さない
      if (error?.name !== "AbortError") {
        alert("エクスポート処理に失敗しました。下の「テキストとしてコピー」をお試しください。");
      }
    }
  };

  const handleCopyText = async () => {
    if (records.length === 0) {
      alert("保存されている記録がありません。");
      return;
    }
    try {
      const jsonStr = JSON.stringify(records, null, 2);
      await navigator.clipboard.writeText(jsonStr);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      alert("コピーに失敗しました。");
    }
  };

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

        onImportRecords(parsed);
        alert(`${parsed.length} 件の記録をインポートしました。`);
        onClose();
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
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-2xl p-5 shadow-xl animate-in slide-in-from-bottom duration-200 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-900">データバックアップ管理</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          食事記録（全{records.length}件）をJSON形式で保存・復元できます。
        </p>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all"
          >
            <Download className="w-4 h-4" />
            <span>JSONデータのエクスポート（ファイル保存）</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-200 active:scale-[0.98] transition-all"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">クリップボードにコピーしました</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-500" />
                <span>JSONテキストをコピー</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            <Upload className="w-4 h-4 text-gray-500" />
            <span>JSONデータのインポート（復元）</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-200 transition-all"
        >
          閉じる
        </button>
      </div>
    </div>
  );
};
"use client";

import React, { useState, useRef } from "react";
import { Camera, Image as ImageIcon, Send, Loader2, Calendar } from "lucide-react";

interface MealInputProps {
  onRecordSubmit: (text: string, consumedAt: string) => Promise<void>;
  isAnalyzing: boolean;
}

// 日本時間の現在日時を "YYYY-MM-DDTHH:mm" 形式で取得
function getCurrentDateTimeLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

// iPhoneの高解像度画像をブラウザ内で長辺1200px・JPEGに圧縮する関数
function compressImage(file: File, maxDimension = 1200, quality = 0.8): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context is not available"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const base64 = dataUrl.split(",")[1];
        resolve({ base64, mimeType: "image/jpeg" });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function MealInput({ onRecordSubmit, isAnalyzing }: MealInputProps) {
  const [text, setText] = useState("");
  const [consumedAt, setConsumedAt] = useState(getCurrentDateTimeLocal());
  const [isRecognizingImage, setIsRecognizingImage] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // 画像を圧縮して食材認識APIへ送信
  const handleImageSelected = async (file: File) => {
    setIsRecognizingImage(true);
    try {
      // 1. 画像圧縮
      const { base64, mimeType } = await compressImage(file);

      // 2. API送信
      const res = await fetch("/api/recognize-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: mimeType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "認識サーバーでエラーが発生しました");
      }

      if (data.recognizedText) {
        setText((prev) =>
          prev ? `${prev}, ${data.recognizedText}` : data.recognizedText
        );
      } else {
        alert("食材を検出できませんでした。直接入力してください。");
      }
    } catch (e: any) {
      console.error(e);
      alert(`画像の認識に失敗しました: ${e.message}`);
    } finally {
      setIsRecognizingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() || isAnalyzing || isRecognizingImage) return;
    await onRecordSubmit(text.trim(), consumedAt);
    setText("");
    setConsumedAt(getCurrentDateTimeLocal());
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/80 space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="料理名や食材を入力（例: 鶏むね肉200g、カレーライス1杯）&#13;&#10;※写真から読み取られた内容もここで修正できます"
        rows={3}
        className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
      />

      {/* 日時選択欄 */}
      <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
        <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <span className="font-medium flex-shrink-0">食べた日時:</span>
        <input
          type="datetime-local"
          value={consumedAt}
          onChange={(e) => setConsumedAt(e.target.value)}
          className="bg-transparent focus:outline-none w-full text-gray-800"
        />
      </div>

      {isRecognizingImage && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
          <span>写真から食材と分量を判別中...</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-2">
          {/* カメラ起動 */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleImageSelected(e.target.files[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isRecognizingImage || isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50"
          >
            <Camera className="w-4 h-4 text-gray-500" />
            <span>撮影</span>
          </button>

          {/* アルバムから選択 */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleImageSelected(e.target.files[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={isRecognizingImage || isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50"
          >
            <ImageIcon className="w-4 h-4 text-gray-500" />
            <span>写真</span>
          </button>
        </div>

        {/* 記録ボタン */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim() || isRecognizingImage || isAnalyzing}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-40"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>解析中...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>記録</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
"use client";

import React, { useState, useRef } from "react";
import { Camera, Image as ImageIcon, Send, Loader2, X } from "lucide-react";

interface MealInputProps {
  onAnalysisComplete: (result: any) => void;
}

export const MealInput: React.FC<MealInputProps> = ({ onAnalysisComplete }) => {
  const [textInput, setTextInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(",")[1];
      setSelectedImage(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() && !selectedImage) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textInput,
          imageBase64: selectedImage,
          mimeType: mimeType,
        }),
      });

      if (!res.ok) throw new Error("解析に失敗しました");

      const data = await res.json();
      onAnalysisComplete(data);
      setTextInput("");
      setSelectedImage(null);
      setMimeType(null);
    } catch (err: any) {
      setError(err.message || "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <form onSubmit={handleSubmit} className="space-y-3">
        {selectedImage && (
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
            <img
              src={`data:${mimeType};base64,${selectedImage}`}
              alt="プレビュー"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setSelectedImage(null);
                setMimeType(null);
              }}
              className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full active:scale-95 transition-transform"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="料理名や食材を入力（例: 鶏むね肉200g、カレーライス1杯）"
            rows={2}
            className="w-full p-3 text-base bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            type="file"
            accept="image/*"
            ref={galleryInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl active:bg-gray-200 transition-colors"
            >
              <Camera className="w-4 h-4 text-gray-600" />
              撮影
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl active:bg-gray-200 transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-gray-600" />
              写真
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || (!textInput.trim() && !selectedImage)}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl disabled:bg-gray-300 active:scale-95 transition-all shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                解析中
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                記録
              </>
            )}
          </button>
        </div>

        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </form>
    </div>
  );
};
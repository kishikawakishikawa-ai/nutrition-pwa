import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { mealAnalysisSchema } from "./schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { text, imageBase64, mimeType } = await req.json();
    const contents: any[] = [];

    if (imageBase64 && mimeType) {
      contents.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      });
    }

    const promptText = text 
      ? `以下の食事内容を解析してください: ${text}`
      : "提供された食事画像を解析してください。";
    contents.push(promptText);

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: contents,
      config: {
        systemInstruction: "あなたは管理栄養士および食品解析AIです。日本食品標準成分表に基づき正確に栄養素を推定してください。",
        responseMimeType: "application/json",
        responseSchema: mealAnalysisSchema,
        temperature: 0.1,
      },
    });

    const parsedData = JSON.parse(response.text ?? "{}");
    return NextResponse.json(parsedData);
  } catch (error) {
    console.error("Meal Analysis Error:", error);
    return NextResponse.json({ error: "解析に失敗しました" }, { status: 500 });
  }
}
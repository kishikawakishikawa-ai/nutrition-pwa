import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "解析対象のテキストが提示されていません。" },
        { status: 400 }
      );
    }

    // 利用可能な安定モデル名に変更
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `あなたは栄養管理アシスタントです。ユーザーが入力した食事内容を解析し、栄養素データを計算して以下のJSONフォーマットで返却してください。

キー名は日本語・英語のいずれの指定でも処理できるように配慮してください。

【返却フォーマット】
{
  "foodText": "食事内容のまとめ",
  "nutrients": {
    "エネルギー": 数値(kcal),
    "タンパク質": 数値(g),
    "脂質": 数値(g),
    "炭水化物": 数値(g),
    "食物繊維": 数値(g),
    "ビタミンA": 数値,
    "ビタミンB1": 数値
  }
}

解析対象の食事内容:
${text}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const parsedData = JSON.parse(responseText);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error?.message || "解析処理中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
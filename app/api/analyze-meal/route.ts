import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // meal_text と text のどちらで届いても取得できるように指定
    const text = body.meal_text || body.text;

    if (!text || typeof text !== "string" || text.trim() === "") {
      return NextResponse.json(
        { error: "解析対象のテキストが提示されていません。" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `あなたは栄養管理アシスタントです。以下の食事内容を解析し、含まれる食品アイテムごとの栄養素データを計算してJSON形式で返却してください。

【返却フォーマット】
{
  "meal_summary": "食事内容の要約",
  "items": [
    {
      "name": "食品名",
      "nutrients": {
        "calories_kcal": 数値,
        "protein_g": 数値,
        "fat_g": 数値,
        "carbs_g": 数値,
        "fiber_g": 数値,
        "salt_equivalent_g": 数値,
        "vitamin_a_ug": 数値,
        "vitamin_b1_mg": 数値,
        "vitamin_b2_mg": 数値,
        "vitamin_c_mg": 数値,
        "vitamin_d_ug": 数値,
        "calcium_mg": 数値,
        "iron_mg": 数値,
        "zinc_mg": 数値,
        "potassium_mg": 数値,
        "magnesium_mg": 数値
      }
    }
  ]
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
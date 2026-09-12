import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// 混雑時は自動で次のモデルに切り替える
const CANDIDATE_MODELS = ["gemini-3.6-flash", "gemini-2.5-flash"];

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEYが設定されていません" },
        { status: 500 }
      );
    }

    const { meal_text } = await req.json();
    if (!meal_text || typeof meal_text !== "string") {
      return NextResponse.json(
        { error: "食事内容のテキストが正しく指定されていません" },
        { status: 400 }
      );
    }

    const prompt = `
あなたは管理栄養士です。入力された食事内容「${meal_text}」を正確に分析し、食材・料理ごとの栄養素（文部科学省「日本食品標準成分表」ベースの推定値）を算出してJSONで出力してください。

【厳格な指示】
1. 入力テキストに記載された食材・分量のみを対象としてください。勝手に別の料理に置き換えないでください。
2. meal_summary には、入力された食事内容を簡潔にまとめた文字列を出力してください。
3. 栄養素の数値は必ず整数または小数第1位までの数値（number）で出力してください。

【出力JSONスキーマ】
{
  "meal_summary": "入力に基づく食事の要約",
  "items": [
    {
      "name": "品目名",
      "quantity_g": 0,
      "nutrients": {
        "calories_kcal": 0,
        "protein_g": 0,
        "fat_g": 0,
        "carbs_g": 0,
        "fiber_g": 0,
        "salt_equivalent_g": 0,
        "vitamin_a_ug": 0,
        "vitamin_b1_mg": 0,
        "vitamin_b2_mg": 0,
        "vitamin_c_mg": 0,
        "vitamin_d_ug": 0,
        "calcium_mg": 0,
        "iron_mg": 0,
        "zinc_mg": 0,
        "potassium_mg": 0,
        "magnesium_mg": 0
      }
    }
  ]
}
`;

    let lastError: any = null;

    // モデル切り替えとリトライ処理
    for (const modelName of CANDIDATE_MODELS) {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" },
      });

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (attempt > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          const parsedData = JSON.parse(responseText);
          return NextResponse.json(parsedData);
        } catch (err: any) {
          lastError = err;
          console.warn(`Analyze meal attempt ${attempt + 1} with ${modelName} failed:`, err?.message);
        }
      }
    }

    throw lastError;
  } catch (error: any) {
    console.error("Meal Analysis API Error:", error);
    return NextResponse.json(
      { error: error.message || "食事の栄養解析に失敗しました" },
      { status: 500 }
    );
  }
}
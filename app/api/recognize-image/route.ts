import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEYがサーバーに設定されていません" },
        { status: 500 }
      );
    }

    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "画像データが見つかりません" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
    });

    const prompt = `
画像に写っている料理や食材をすべて特定し、品目名と推定重量（グラム、または個数・杯数などの目安）を箇条書きまたはカンマ区切りの日本語テキストで出力してください。
挨拶や説明文、Markdown装飾（**や#など）は一切含めず、食材名と分量のみを出力してください。

出力例:
白米 180g, 焼き鮭 1切れ(80g), ほうれん草のおひたし 50g, わかめと豆腐の味噌汁 1杯
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || "image/jpeg",
        },
      },
    ]);

    const recognizedText = result.response.text().trim();

    return NextResponse.json({ recognizedText });
  } catch (error: any) {
    console.error("Image Recognition Error:", error);
    return NextResponse.json(
      { error: error.message || "画像認識処理に失敗しました" },
      { status: 500 }
    );
  }
}
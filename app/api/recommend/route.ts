import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { recommendationSchema } from "./schema";
import { getTopDeficiencies, NutrientTargets } from "@/types/nutrition";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { consumed3Days, dailyTarget } = await req.json() as {
      consumed3Days: NutrientTargets;
      dailyTarget: NutrientTargets;
    };

    if (!consumed3Days || !dailyTarget) {
      return NextResponse.json({ error: "パラメータ不足" }, { status: 400 });
    }

    const deficiencies = getTopDeficiencies(consumed3Days, dailyTarget, 3);

    if (deficiencies.length === 0) {
      return NextResponse.json({
        period_summary: "直近3日間の主要な栄養素は目標基準を満たしています。",
        recommendations: [],
      });
    }

    const deficiencyDetails = deficiencies
      .map(
        (d) =>
          `- ${d.name}: 3日目標 ${d.target_3days}${d.unit}、摂取量 ${d.consumed}${d.unit}（充足率 ${d.fulfillment_rate}%）`
      )
      .join("\n");

    const prompt = `
直近3日間の不足栄養素データに基づき、補うための食材と料理を提案してください。
【不足栄養素】
${deficiencyDetails}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [prompt],
      config: {
        systemInstruction: "あなたは管理栄養士です。3日間の不足栄養素を補う食材と料理を具体的に提案してください。",
        responseMimeType: "application/json",
        responseSchema: recommendationSchema,
        temperature: 0.2,
      },
    });

    const parsedResponse = JSON.parse(response.text ?? "{}");
    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error("Recommendation Error:", error);
    return NextResponse.json({ error: "レコメンド生成失敗" }, { status: 500 });
  }
}
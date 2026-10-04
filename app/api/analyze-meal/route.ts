
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// 現在のメインモデルと代替モデル。
// 代替モデルは、Google AI Studioで利用権限を確認してください。
const CANDIDATE_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-2.5-flash",
];

const MAX_ATTEMPTS_PER_MODEL = 3;
const INITIAL_DELAY_MS = 1000;
const MAX_DELAY_MS = 8000;

function getStatusCode(error: unknown): number | undefined {
  const e = error as {
    status?: number;
    statusCode?: number;
    message?: string;
    response?: { status?: number };
  };

  const directStatus = e?.status ?? e?.statusCode ?? e?.response?.status;
  if (typeof directStatus === "number") return directStatus;

  // SDKのエラーメッセージに含まれるHTTPステータスも確認
  const message = String(e?.message ?? "");
  const match = message.match(/\b(400|401|403|404|408|429|500|502|503|504)\b/);
  return match ? Number(match[1]) : undefined;
}

function isRetryable(error: unknown): boolean {
  const status = getStatusCode(error);

  // 一時的なサーバー障害・レート制限・タイムアウト
  if (
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return true;
  }

  // HTTPステータスを取得できない通信エラー
  const message = String(
    (error as { message?: string })?.message ?? ""
  );

  return /fetch failed|network|ECONNRESET|ETIMEDOUT|socket hang up/i.test(
    message
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithRetry(
  modelName: string,
  prompt: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_MODEL; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // 不正なJSONは再試行対象とせず、上位にエラーを返す
      JSON.parse(responseText);

      return responseText;
    } catch (error) {
      lastError = error;

      if (!isRetryable(error)) {
        throw error;
      }

      if (attempt < MAX_ATTEMPTS_PER_MODEL - 1) {
        const exponentialDelay = Math.min(
          INITIAL_DELAY_MS * 2 ** attempt,
          MAX_DELAY_MS
        );

        // 同時アクセス時の再試行集中を避ける
        const jitter = Math.floor(Math.random() * 500);
        const waitMs = exponentialDelay + jitter;

        console.warn(
          `[Gemini] model=${modelName}, ` +
          `attempt=${attempt + 1}, ` +
          `status=${getStatusCode(error) ?? "network"}, ` +
          `retryIn=${waitMs}ms`
        );

        await sleep(waitMs);
      }
    }
  }

  throw lastError;
}

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json(
      {
        code: "CONFIG_ERROR",
        error: "サーバーのAPI設定に問題があります。",
      },
      { status: 500 }
    );
  }

  let text: unknown;

  try {
    const body = await req.json();
    text = body.meal_text || body.text;
  } catch {
    return NextResponse.json(
      { code: "INVALID_JSON", error: "入力データを読み取れません。" },
      { status: 400 }
    );
  }

  if (typeof text !== "string" || text.trim() === "") {
    return NextResponse.json(
      { code: "EMPTY_INPUT", error: "食事内容を入力してください。" },
      { status: 400 }
    );
  }

  const prompt = `あなたは栄養管理アシスタントです。
以下の食事内容を解析し、食品アイテムごとの栄養素データをJSON形式で返してください。

【重要】
- 食品名、量、調理方法を考慮して推定してください。
- 量が不明な場合は妥当な標準量を推定してください。
- 栄養素の値は数値で返してください。
- 不明な値も可能な限り妥当な推定値を返してください。
- JSON以外の文章やMarkdownは出力しないでください。

【返却フォーマット】
{
  "meal_summary": "食事内容の要約",
  "items": [
    {
      "name": "食品名と量",
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

解析対象の食事内容:
${text.trim()}`;

  let lastError: unknown;

  for (let modelIndex = 0; modelIndex < CANDIDATE_MODELS.length; modelIndex++) {
    const modelName = CANDIDATE_MODELS[modelIndex];

    try {
      const responseText = await generateWithRetry(modelName, prompt);
      const parsedData = JSON.parse(responseText);

      if (
        !parsedData ||
        typeof parsedData !== "object" ||
        !Array.isArray(parsedData.items)
      ) {
        throw new Error("Geminiから予期しないJSON形式が返されました。");
      }

      // クライアント側で必要な形式を維持
      return NextResponse.json(parsedData, {
        headers: { "Cache-Control": "no-store" },
      });
    } catch (error) {
      lastError = error;

      const status = getStatusCode(error);
      const retryable = isRetryable(error);

      console.error(
        `[Gemini] model=${modelName}, status=${status ?? "unknown"}, ` +
        `retryable=${retryable}`
      );

      // 認証・権限・不正リクエスト等はモデルを変えても直らない
      if (!retryable) break;

      // 次のモデルに切り替える
      if (modelIndex < CANDIDATE_MODELS.length - 1) {
        console.warn(
          `[Gemini] Switching from ${modelName} to ` +
          `${CANDIDATE_MODELS[modelIndex + 1]}`
        );
      }
    }
  }

  const finalStatus = getStatusCode(lastError);

  if (finalStatus === 429) {
    return NextResponse.json(
      {
        code: "RATE_LIMIT",
        error: "AIの利用上限に達しています。少し時間をおいて再度お試しください。",
      },
      { status: 429 }
    );
  }

  if (
    finalStatus === 503 ||
    finalStatus === 500 ||
    finalStatus === 502 ||
    finalStatus === 504 ||
    finalStatus === 408 ||
    finalStatus === undefined
  ) {
    return NextResponse.json(
      {
        code: "AI_TEMPORARY_UNAVAILABLE",
        error: "現在、食事の解析が混み合っています。入力内容は保持されていますので、少し時間をおいて再度お試しください。",
      },
      { status: 503 }
    );
  }

  console.error("Meal analysis failed:", lastError);

  return NextResponse.json(
    {
      code: "AI_ANALYSIS_FAILED",
      error: "食事を解析できませんでした。入力内容を確認して再度お試しください。",
    },
    { status: 500 }
  );
}
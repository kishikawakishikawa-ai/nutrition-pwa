
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { performance } from "perf_hooks";

export const maxDuration = 60;

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// 現在使用しているモデルを維持
const PRIMARY_MODEL = "gemini-3.8-flash";
const FALLBACK_MODEL = "gemini-2.5-flash";

// 待ち時間を抑える設定
const RETRY_DELAY_MS = 800;
const REQUEST_TIMEOUT_MS = 20000;

function getStatusCode(error: unknown): number | undefined {
  const e = error as {
    status?: number;
    statusCode?: number;
    message?: string;
    response?: { status?: number };
  };

  const direct = e?.status ?? e?.statusCode ?? e?.response?.status;
  if (typeof direct === "number") return direct;

  const message = String(e?.message ?? "");
  const match = message.match(/\b(400|401|403|404|408|429|500|502|503|504)\b/);
  return match ? Number(match[1]) : undefined;
}

function isRetryable(error: unknown): boolean {
  const status = getStatusCode(error);

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

  const message = String(
    (error as { message?: string })?.message ?? ""
  );

  return /fetch failed|network|ECONNRESET|ETIMEDOUT|socket hang up|timed out/i.test(
    message
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logEvent(
  event: string,
  details: Record<string, unknown>
) {
  console.log(
    JSON.stringify({
      scope: "meal-analysis",
      event,
      time: new Date().toISOString(),
      ...details,
    })
  );
}

async function generateOnce(
  modelName: string,
  prompt: string,
  requestId: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const started = performance.now();

  logEvent("model_start", { requestId, model: modelName });

  try {
    // AbortSignal.timeoutが対応していない環境ではcatchへ進むため、
    // Vercel本番環境で動作確認してください。
    const result = await model.generateContent(
      prompt,
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
    );

    const responseText = result.response.text();
    JSON.parse(responseText);

    logEvent("model_success", {
      requestId,
      model: modelName,
      durationMs: Math.round(performance.now() - started),
      responseChars: responseText.length,
    });

    return responseText;
  } catch (error) {
    logEvent("model_error", {
      requestId,
      model: modelName,
      durationMs: Math.round(performance.now() - started),
      status: getStatusCode(error) ?? "unknown",
      retryable: isRetryable(error),
      message: String((error as { message?: string })?.message ?? error)
        .slice(0, 250),
    });

    throw error;
  }
}

export async function POST(req: Request) {
  const requestId = randomUUID();
  const requestStarted = performance.now();

  logEvent("request_start", { requestId });

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
  let attempts = 0;

  // 最大3回：メインモデル2回、代替モデル1回
  const plan = [
    { model: PRIMARY_MODEL, retry: false },
    { model: PRIMARY_MODEL, retry: true },
    { model: FALLBACK_MODEL, retry: false },
  ];

  for (const step of plan) {
    if (step.retry) {
      if (!lastError || !isRetryable(lastError)) break;

      logEvent("retry_wait", {
        requestId,
        delayMs: RETRY_DELAY_MS,
      });

      await sleep(RETRY_DELAY_MS);
    } else if (lastError && !isRetryable(lastError)) {
      break;
    }

    attempts++;

    try {
      const responseText = await generateOnce(
        step.model,
        prompt,
        requestId
      );

      const parsedData = JSON.parse(responseText);

      if (
        !parsedData ||
        typeof parsedData !== "object" ||
        !Array.isArray(parsedData.items)
      ) {
        throw new Error("Geminiから予期しないJSON形式が返されました。");
      }

      logEvent("request_success", {
        requestId,
        model: step.model,
        attempts,
        totalDurationMs: Math.round(performance.now() - requestStarted),
      });

      return NextResponse.json(parsedData, {
        headers: {
          "Cache-Control": "no-store",
          "X-Request-ID": requestId,
        },
      });
    } catch (error) {
      lastError = error;

      logEvent("attempt_failed", {
        requestId,
        model: step.model,
        attempt: attempts,
        status: getStatusCode(error) ?? "unknown",
        retryable: isRetryable(error),
      });
    }
  }

  const status = getStatusCode(lastError);

  logEvent("request_failed", {
    requestId,
    attempts,
    status: status ?? "unknown",
    totalDurationMs: Math.round(performance.now() - requestStarted),
  });

  if (status === 429) {
    return NextResponse.json(
      {
        code: "RATE_LIMIT",
        error: "AIの利用上限に達しています。少し時間をおいて再度お試しください。",
      },
      { status: 429 }
    );
  }

  if (
    status === 408 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    status === undefined
  ) {
    return NextResponse.json(
      {
        code: "AI_TEMPORARY_UNAVAILABLE",
        error: "食事の解析に時間がかかっています。入力内容は保持されていますので、少し時間をおいて再度お試しください。",
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      code: "AI_ANALYSIS_FAILED",
      error: "食事を解析できませんでした。入力内容を確認して再度お試しください。",
    },
    { status: 500 }
  );
}

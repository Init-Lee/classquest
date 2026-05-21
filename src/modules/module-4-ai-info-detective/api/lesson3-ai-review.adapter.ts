/**
 * 文件说明：模块 4 课时 3 题卡自检助手 adapter。
 * 职责：为前端组件提供唯一 AI review 调用入口，默认返回 mock 建议，可通过环境变量切换到后端 HTTP。
 * 更新触发：课时 3 AI review endpoint、错误映射、mock 策略或请求脱敏规则变化时，需要同步更新本文件。
 */

import type { Lesson3AiReviewRequest, Lesson3AiReviewResponse } from "./types"

const HTTP_ENDPOINT = "/api/v1/module4/lesson3/ai-review"

function buildMockChecks(payload: Lesson3AiReviewRequest): Lesson3AiReviewResponse["result"]["checks"] {
  const checks: Lesson3AiReviewResponse["result"]["checks"] = []
  if (!payload.material.titleOrName.trim()) {
    checks.push({ area: "material", level: "error", message: "素材短名还没有填写。", suggestion: "补充一个便于识别的素材标题或短名。" })
  }
  if (!payload.task.correctOptionKey) {
    checks.push({ area: "task", level: "error", message: "还没有选择参考答案。", suggestion: "从 A/B/C 中选择最适合的参考答案。" })
  }
  if (payload.explanation.text.trim().length < 40) {
    checks.push({ area: "explanation", level: "warning", message: "解析还可以更具体。", suggestion: "写出具体画面、文字或核验线索，建议 40 字以上。" })
  }
  if (!payload.source.sourceType || payload.source.sourceRecord.trim().length < 6) {
    checks.push({ area: "source", level: "warning", message: "来源与核验入口还不够清楚。", suggestion: "补充链接、平台、生成记录、拍摄说明或加工过程。" })
  }
  if (checks.length === 0) {
    checks.push({ area: "task", level: "ok", message: "题卡结构完整，可以保存为 V1 初稿。" })
  }
  return checks
}

function buildMockResponse(payload: Lesson3AiReviewRequest): Lesson3AiReviewResponse {
  const checks = buildMockChecks(payload)
  const missingRequiredFields = checks
    .filter(check => check.level === "error")
    .map(check => check.area)
  return {
    requestId: `mock_lesson3_${payload.kind}_${Date.now()}`,
    provider: "mock",
    reviewedAt: new Date().toISOString(),
    result: {
      status: missingRequiredFields.length > 0 ? "blocked" : checks.some(check => check.level === "warning") ? "needs_revision" : "pass",
      summary: missingRequiredFields.length > 0
        ? "题卡还有必填信息缺失。"
        : checks.some(check => check.level === "warning")
          ? "题卡基本结构已形成，建议补充后保存。"
          : "题卡结构完整，可以保存为 V1。",
      checks,
      missingRequiredFields,
      suggestedEdits: checks.map(check => check.suggestion).filter((text): text is string => Boolean(text)),
      safetyFlags: [],
    },
  }
}

function mapHttpError(status: number): string {
  if (status === 400) return "题卡信息不完整，暂时无法自检。"
  if (status === 413) return "图片太大，请重新压缩或跳过自检。"
  if (status === 429) return "自检次数较多，请稍后再试。"
  return "自检助手暂时不可用，不影响保存 V1。"
}

export async function reviewLesson3QuestionCard(payload: Lesson3AiReviewRequest): Promise<Lesson3AiReviewResponse> {
  const mode = import.meta.env.VITE_MODULE4_LESSON3_AI_REVIEW_MODE
  if (mode !== "http") return buildMockResponse(payload)

  const response = await fetch(HTTP_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(mapHttpError(response.status))
  return response.json() as Promise<Lesson3AiReviewResponse>
}

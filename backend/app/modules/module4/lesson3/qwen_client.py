"""
文件说明：模块 4 课时 3 AI review provider。
职责：提供默认 mock provider 与可通过环境变量切换的 Qwen provider stub，避免浏览器端持有 API key。
更新触发：provider 选择、Qwen 请求形状、限流策略或结构化解析策略变化时，需要同步更新本文件。
"""

import os
from datetime import datetime, timezone
from typing import Protocol

import httpx

from .prompt import LESSON3_AI_REVIEW_SYSTEM_PROMPT
from .schemas import (
    Lesson3AiReviewCheck,
    Lesson3AiReviewRequest,
    Lesson3AiReviewResponse,
    Lesson3AiReviewResult,
)


class Lesson3AiReviewProvider(Protocol):
    """题卡自检 provider 协议。"""

    async def review(self, payload: Lesson3AiReviewRequest) -> Lesson3AiReviewResponse:
        """返回结构化题卡质量建议。"""
        ...


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


class MockLesson3AiReviewProvider:
    """默认 mock provider，用字段完整度生成可预测建议。"""

    async def review(self, payload: Lesson3AiReviewRequest) -> Lesson3AiReviewResponse:
        checks: list[Lesson3AiReviewCheck] = []
        if not payload.material.titleOrName.strip():
            checks.append(Lesson3AiReviewCheck(area="material", level="error", message="素材短名还没有填写。", suggestion="补充一个便于识别的素材标题或短名。"))
        if not payload.task.correctOptionKey:
            checks.append(Lesson3AiReviewCheck(area="task", level="error", message="还没有选择参考答案。", suggestion="从 A/B/C 中选择最适合的参考答案。"))
        if len(payload.explanation.text.strip()) < 40:
            checks.append(Lesson3AiReviewCheck(area="explanation", level="warning", message="解析还可以更具体。", suggestion="补充具体画面、文字或核验线索。"))
        if not payload.source.sourceType or len(payload.source.sourceRecord.strip()) < 6:
            checks.append(Lesson3AiReviewCheck(area="source", level="warning", message="来源与核验入口还不够清楚。", suggestion="补充可追溯信息。"))
        if not checks:
            checks.append(Lesson3AiReviewCheck(area="task", level="ok", message="题卡结构完整，可以保存为 V1 初稿。"))

        missing = [check.area for check in checks if check.level == "error"]
        status = "blocked" if missing else "needs_revision" if any(check.level == "warning" for check in checks) else "pass"
        return Lesson3AiReviewResponse(
            requestId=f"mock_lesson3_{payload.kind}_{int(datetime.now().timestamp())}",
            provider="mock",
            reviewedAt=_now_iso(),
            result=Lesson3AiReviewResult(
                status=status,
                summary="题卡结构完整，可以保存为 V1。" if status == "pass" else "题卡仍有可补充项。",
                checks=checks,
                missingRequiredFields=missing,
                suggestedEdits=[check.suggestion for check in checks if check.suggestion],
                safetyFlags=[],
            ),
        )


class QwenLesson3AiReviewProvider:
    """Qwen provider stub，保留 HTTP 调用边界但本阶段不做真实联调。"""

    async def review(self, payload: Lesson3AiReviewRequest) -> Lesson3AiReviewResponse:
        api_key = os.getenv("DASHSCOPE_API_KEY", "")
        if not api_key:
            return await MockLesson3AiReviewProvider().review(payload)

        timeout = float(os.getenv("LESSON3_AI_REVIEW_TIMEOUT_SECONDS", "20"))
        base_url = os.getenv("QWEN_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1").rstrip("/")
        model = os.getenv("QWEN_TEXT_MODEL", "qwen-plus")
        body = {
            "model": model,
            "messages": [
                {"role": "system", "content": LESSON3_AI_REVIEW_SYSTEM_PROMPT},
                {"role": "user", "content": payload.json(exclude={"material": {"assetDataUrl"}})},
            ],
        }
        async with httpx.AsyncClient(timeout=timeout) as client:
            await client.post(
                f"{base_url}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json=body,
            )
        return await MockLesson3AiReviewProvider().review(payload)


def get_lesson3_ai_review_provider() -> Lesson3AiReviewProvider:
    """按环境变量选择 provider；默认 mock。"""
    provider = os.getenv("LESSON3_AI_REVIEW_PROVIDER", "mock").lower()
    if provider == "qwen":
        return QwenLesson3AiReviewProvider()
    return MockLesson3AiReviewProvider()

"""
文件说明：模块 4 课时 3 AI review provider。
职责：提供默认 mock provider 与可通过环境变量切换的 Qwen provider，避免浏览器端持有 API key。
更新触发：provider 选择、Qwen 请求形状、限流策略或结构化解析策略变化时，需要同步更新本文件。
"""

import json
import os
import time
from datetime import datetime, timezone
from typing import Any, Protocol
from uuid import uuid4

import httpx

from ..shared.qwen_http import QwenHttpError, read_dashscope_api_key
from .prompt import LESSON3_AI_REVIEW_SYSTEM_PROMPT
from .schemas import (
    Lesson3AiReviewCheck,
    Lesson3AiReviewRequest,
    Lesson3AiReviewResponse,
    Lesson3AiReviewResult,
)

SOURCE_TYPE_LABELS = {
    "web": "网络来源",
    "ai_generated": "AI 生成",
    "field_capture": "现场采集",
    "mixed": "混合加工",
}

KIND_LABELS = {
    "news": "新闻题卡",
    "image": "图片题卡",
}

INTERNAL_TEXT_REPLACEMENTS = {
    "sourceType": "来源类型",
    "titleOrName": "素材短名",
    "correctOptionKey": "参考答案",
    "assetFingerprint": "素材指纹",
    "sourceRecord": "来源记录",
    "verificationNote": "核验观察指引",
    "displayNote": "展示说明",
    "ai_generated": "AI 生成",
    "field_capture": "现场采集",
    "human_created": "真实拍摄或人工制作",
    "historical_record": "历史资料",
}

class Lesson3AiReviewProvider(Protocol):
    """题卡自检 provider 协议。"""

    async def review(self, payload: Lesson3AiReviewRequest) -> Lesson3AiReviewResponse:
        """返回结构化题卡质量建议。"""
        ...

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

class QwenProviderError(RuntimeError):
    """Qwen provider 可定位错误，不包含密钥或完整模型响应。"""

def _student_facing_text(text: Any) -> str:
    """把模型可能复述的内部字段名替换成学生可理解的中文。"""
    value = str(text or "")
    for source, target in INTERNAL_TEXT_REPLACEMENTS.items():
        value = value.replace(source, target)
    return value

def _safe_payload_text(payload: Lesson3AiReviewRequest) -> str:
    """生成中文标签化题卡内容，避免把 JSON 字段名暴露给模型和学生反馈。"""
    options_text = "\n".join(
        f"- {option.key}. {option.label}{f'（选项解析：{option.rationale}）' if getattr(option, 'rationale', None) else ''}"
        for option in payload.task.options
    )
    correct_option = payload.task.correctOptionKey or "未选择"
    source_type_label = SOURCE_TYPE_LABELS.get(payload.source.sourceType or "", "未选择")
    asset_note = "有素材图片" if payload.material.assetFingerprint or payload.material.assetMimeType else "未提供素材图片"
    return "\n".join(
        [
            f"题卡类型：{KIND_LABELS.get(payload.kind, payload.kind)}",
            "",
            "【素材展示】",
            f"素材短名：{payload.material.titleOrName or '未填写'}",
            f"展示说明：{payload.material.displayNote or '未填写'}",
            f"素材图片：{asset_note}",
            "",
            "【判断任务】",
            f"题干：{payload.task.prompt or '未填写'}",
            "选项：",
            options_text or "未填写",
            f"参考答案：{correct_option}",
            "",
            "【核心解析】",
            payload.explanation.text or "未填写",
            "",
            "【来源核验】",
            f"来源类型：{source_type_label}",
            f"来源记录：{payload.source.sourceRecord or '未填写'}",
            f"核验观察指引：{payload.source.verificationNote or '未填写'}",
        ]
    )

def _review_input_fingerprint(payload: Lesson3AiReviewRequest) -> str:
    """生成不含密钥和完整图片的输入指纹，用于观察重复自检是否输入相同。"""
    payload_data = payload.dict(exclude={"material": {"assetDataUrl"}, "clientContext": {"requestNo"}})
    return json.dumps(payload_data, ensure_ascii=False, sort_keys=True)

def _build_review_prompt(payload: Lesson3AiReviewRequest) -> str:
    """组装给 Qwen 的用户提示，只要求输出 V1 最低可运行检查结果。"""
    return "\n".join(
        [
            "请检查下面这张课时 3 V1 题卡。",
            "当前任务是 V1 最低可运行检查，不是 V2 精修，不是 V3 发布审核，不是事实核查。",
            "只评价题卡是否具备最低可运行结构：有素材、有题干和选项、有参考答案、有基本解析、有来源或核验入口。",
            "请按四个板块分别检查：素材展示、判断任务、核心解析、来源核验。",
            "blocked 只能用于硬性必填缺失；表达粗糙、解析不够细、来源不够规范、选项可优化，最多 warning。",
            "如果你没有实际看到图片内容，不得评价图片视觉细节是否充分，也不得判断图片是否一定由 AI 生成。",
            "反馈中不要出现 JSON 字段名或英文枚举值。",
            "请返回符合系统提示 schema 的 JSON，并确保 checks 正好包含 material、task、explanation、source 四条。",
            "",
            _safe_payload_text(payload),
        ]
    )

def _extract_json_object(raw_text: str) -> dict[str, Any]:
    """从模型文本中提取 JSON object，兼容偶发的代码块或前后缀说明。"""
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`").strip()
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start < 0 or end <= start:
            raise ValueError("Qwen 返回内容不是 JSON object") from None
        parsed = json.loads(cleaned[start : end + 1])

    if not isinstance(parsed, dict):
        raise ValueError("Qwen 返回 JSON 不是 object")
    return parsed

def _normalize_check(raw_check: Any) -> Lesson3AiReviewCheck:
    """把模型单条建议收敛到前端允许的 area/level 范围。"""
    area_values = {"material", "task", "explanation", "source"}
    level_values = {"ok", "warning", "error"}
    check = raw_check if isinstance(raw_check, dict) else {}
    area = check.get("area") if check.get("area") in area_values else "task"
    level = check.get("level") if check.get("level") in level_values else "warning"
    message = str(check.get("message") or "题卡还有可以补充的地方。")[:160]
    suggestion = check.get("suggestion")
    return Lesson3AiReviewCheck(
        area=area,
        level=level,
        message=_student_facing_text(message)[:160],
        suggestion=_student_facing_text(suggestion)[:160] if suggestion else None,
    )

def _parse_qwen_result(raw_text: str) -> Lesson3AiReviewResult:
    """解析 Qwen JSON，并在字段漂移时做保守归一化。"""
    data = _extract_json_object(raw_text)
    status = data.get("status")
    if status not in {"pass", "needs_revision", "blocked"}:
        status = "needs_revision"

    raw_checks = data.get("checks")
    checks = [_normalize_check(check) for check in raw_checks] if isinstance(raw_checks, list) else []
    if not checks:
        checks = [Lesson3AiReviewCheck(area="task", level="warning", message="自检助手已返回建议，但结构不完整。", suggestion="请人工复核题干、解析和来源是否清楚。")]

    missing_required_fields = [
        str(area)
        for area in data.get("missingRequiredFields", [])
        if area in {"material", "task", "explanation", "source"}
    ] if isinstance(data.get("missingRequiredFields"), list) else []
    suggested_edits = [
        str(item)[:160]
        for item in data.get("suggestedEdits", [])
        if isinstance(item, str) and item.strip()
    ] if isinstance(data.get("suggestedEdits"), list) else []
    safety_flags = [
        str(item)[:80]
        for item in data.get("safetyFlags", [])
        if isinstance(item, str) and item.strip()
    ] if isinstance(data.get("safetyFlags"), list) else []

    return Lesson3AiReviewResult(
        status=status,
        summary=str(data.get("summary") or "题卡自检已完成，请查看下方建议。")[:160],
        checks=checks,
        missingRequiredFields=missing_required_fields[:4],
        suggestedEdits=suggested_edits[:3],
        safetyFlags=safety_flags[:3],
    )

AREA_ORDER = ("material", "task", "explanation", "source")
LEVEL_RANK = {"ok": 0, "warning": 1, "error": 2}

def _has_text(value: Any) -> bool:
    """判断文本是否有有效内容。"""
    return bool(str(value or "").strip())

def _option_keys(payload: Lesson3AiReviewRequest) -> set[str]:
    """提取有效选项 key。"""
    keys: set[str] = set()
    for option in payload.task.options or []:
        if _has_text(getattr(option, "key", "")) and _has_text(getattr(option, "label", "")):
            keys.add(str(option.key))
    return keys

def _get_v1_hard_missing_areas(payload: Lesson3AiReviewRequest) -> set[str]:
    """V1 硬性必填缺失检查；只有这里返回的 area 才允许 blocked。"""
    missing: set[str] = set()

    has_material_asset = bool(
        getattr(payload.material, "assetFingerprint", None)
        or getattr(payload.material, "assetMimeType", None)
        or getattr(payload.material, "assetDataUrl", None)
    )
    has_material_text = bool(
        _has_text(getattr(payload.material, "titleOrName", ""))
        or _has_text(getattr(payload.material, "displayNote", ""))
    )
    if not has_material_asset and not has_material_text:
        missing.add("material")

    option_keys = _option_keys(payload)
    correct_option_key = str(getattr(payload.task, "correctOptionKey", "") or "")
    has_task = (
        _has_text(getattr(payload.task, "prompt", ""))
        and len(option_keys) >= 2
        and _has_text(correct_option_key)
        and correct_option_key in option_keys
    )
    if not has_task:
        missing.add("task")

    if not _has_text(getattr(payload.explanation, "text", "")):
        missing.add("explanation")

    has_source = bool(
        _has_text(getattr(payload.source, "sourceType", ""))
        or _has_text(getattr(payload.source, "sourceRecord", ""))
        or _has_text(getattr(payload.source, "verificationNote", ""))
    )
    if not has_source:
        missing.add("source")

    return missing

def _local_hard_missing_check(area: str) -> Lesson3AiReviewCheck:
    """本地硬性缺失提示，优先级高于模型输出。"""
    messages = {
        "material": (
            "素材展示缺少必要信息。",
            "请至少保留素材图片、素材短名或一句展示说明，让同学知道要看什么。",
        ),
        "task": (
            "判断任务还不完整。",
            "请补齐题干、至少两个选项，并选择一个参考答案。",
        ),
        "explanation": (
            "核心解析还没有填写。",
            "请用一句话说明你的参考答案为什么成立。",
        ),
        "source": (
            "来源与核验入口还没有填写。",
            "请至少补充来源类型、来源记录或一个后续核验提示。",
        ),
    }
    message, suggestion = messages.get(area, ("该板块缺少必要信息。", "请补齐后重新自检。"))
    return Lesson3AiReviewCheck(area=area, level="error", message=message, suggestion=suggestion)

def _local_ok_check(area: str) -> Lesson3AiReviewCheck:
    """模型缺少某项时，用本地 OK 兜底，确保四项齐全。"""
    messages = {
        "material": "素材展示具备 V1 所需的基本信息。",
        "task": "判断任务具备 V1 所需的基本结构。",
        "explanation": "核心解析已填写，具备 V1 的基本依据。",
        "source": "来源与核验入口已提供基本追溯方向。",
    }
    return Lesson3AiReviewCheck(
        area=area,
        level="ok",
        message=messages.get(area, "该板块已满足 V1 基本要求。"),
        suggestion=None,
    )

def _best_check_by_area(checks: list[Lesson3AiReviewCheck]) -> dict[str, Lesson3AiReviewCheck]:
    """将模型返回的 checks 归并为每个 area 一条；同一区域保留最严重的一条。"""
    result: dict[str, Lesson3AiReviewCheck] = {}
    for check in checks:
        if check.area not in AREA_ORDER:
            continue
        existing = result.get(check.area)
        if existing is None or LEVEL_RANK.get(check.level, 1) > LEVEL_RANK.get(existing.level, 1):
            result[check.area] = check
    return result

def _downgrade_error_to_warning(check: Lesson3AiReviewCheck) -> Lesson3AiReviewCheck:
    """V1 已满足硬性必填时，模型 error 只能降级为 warning。"""
    if check.level != "error":
        return check
    return Lesson3AiReviewCheck(
        area=check.area,
        level="warning",
        message=_student_facing_text(check.message),
        suggestion=_student_facing_text(check.suggestion or "这部分可以在课时4继续优化，但不影响保存 V1。"),
    )

def _collect_suggested_edits(checks: list[Lesson3AiReviewCheck]) -> list[str]:
    """从 warning/error checks 中收集最多 3 条建议。"""
    edits: list[str] = []
    for check in checks:
        if check.level == "ok":
            continue
        text = _student_facing_text(check.suggestion or check.message).strip()
        if text and text not in edits:
            edits.append(text[:160])
        if len(edits) >= 3:
            break
    return edits

def _apply_v1_minimum_floor(
    result: Lesson3AiReviewResult,
    payload: Lesson3AiReviewRequest,
) -> Lesson3AiReviewResult:
    """用 V1 最低可运行标准接管最终阻断判定。"""
    hard_missing = _get_v1_hard_missing_areas(payload)
    model_checks_by_area = _best_check_by_area(list(result.checks or []))

    final_checks: list[Lesson3AiReviewCheck] = []
    for area in AREA_ORDER:
        if area in hard_missing:
            final_checks.append(_local_hard_missing_check(area))
            continue

        model_check = model_checks_by_area.get(area)
        if model_check is None:
            final_checks.append(_local_ok_check(area))
            continue

        final_checks.append(_downgrade_error_to_warning(model_check))

    has_error = any(check.level == "error" for check in final_checks)
    has_warning = any(check.level == "warning" for check in final_checks)

    if has_error:
        status = "blocked"
        summary = "存在必须补齐的信息，请先补充后再保存 V1。"
    elif has_warning:
        status = "needs_revision"
        summary = "题卡具备 V1 基本结构，可以保存；建议在课时4继续优化。"
    else:
        status = "pass"
        summary = "题卡结构完整，可以保存为 V1 初稿。"

    return Lesson3AiReviewResult(
        status=status,
        summary=summary,
        checks=final_checks,
        missingRequiredFields=[area for area in AREA_ORDER if area in hard_missing],
        suggestedEdits=_collect_suggested_edits(final_checks),
        safetyFlags=list(result.safetyFlags or [])[:3],
    )

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

        initial_result = Lesson3AiReviewResult(
            status=(
                "blocked"
                if any(check.level == "error" for check in checks)
                else "needs_revision"
                if any(check.level == "warning" for check in checks)
                else "pass"
            ),
            summary=(
                "题卡结构完整，可以保存为 V1。"
                if not any(check.level != "ok" for check in checks)
                else "题卡仍有可补充项。"
            ),
            checks=checks,
            missingRequiredFields=[check.area for check in checks if check.level == "error"],
            suggestedEdits=[check.suggestion for check in checks if check.suggestion],
            safetyFlags=[],
        )
        return Lesson3AiReviewResponse(
            requestId=f"mock_lesson3_{payload.kind}_{int(datetime.now().timestamp())}",
            provider="mock",
            reviewedAt=_now_iso(),
            result=_apply_v1_minimum_floor(initial_result, payload),
        )

class QwenLesson3AiReviewProvider:
    """Qwen provider，通过 OpenAI-compatible Chat Completions 返回结构化建议。"""

    def _build_body(self, payload: Lesson3AiReviewRequest) -> dict[str, Any]:
        """按题卡类型构造 Qwen 请求，默认不发送图片 DataURL。"""
        text_model = os.getenv("QWEN_TEXT_MODEL", "qwen3.5-flash")
        vision_model = os.getenv("QWEN_VISION_MODEL", text_model)
        enable_image_input = os.getenv("QWEN_ENABLE_IMAGE_INPUT", "false").lower() == "true"
        max_tokens = int(os.getenv("QWEN_MAX_TOKENS", "600"))
        user_prompt = _build_review_prompt(payload)

        if payload.kind == "image" and payload.material.assetDataUrl and enable_image_input:
            return {
                "model": vision_model,
                "messages": [
                    {"role": "system", "content": LESSON3_AI_REVIEW_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "image_url", "image_url": {"url": payload.material.assetDataUrl}},
                            {"type": "text", "text": user_prompt},
                        ],
                    },
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.2,
                "max_tokens": max_tokens,
                "enable_thinking": False,
            }

        return {
            "model": text_model,
            "messages": [
                {"role": "system", "content": LESSON3_AI_REVIEW_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
            "max_tokens": max_tokens,
            "enable_thinking": False,
        }

    async def review(self, payload: Lesson3AiReviewRequest) -> Lesson3AiReviewResponse:
        try:
            api_key = read_dashscope_api_key()
        except QwenHttpError as exc:
            raise QwenProviderError(str(exc)) from exc
        if not api_key:
            return await MockLesson3AiReviewProvider().review(payload)

        timeout = float(os.getenv("LESSON3_AI_REVIEW_TIMEOUT_SECONDS", "20"))
        base_url = os.getenv("QWEN_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1").rstrip("/")
        body = self._build_body(payload)
        started_at = time.perf_counter()
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json=body,
            )
            response.raise_for_status()

        response_data = response.json()
        raw_text = response_data["choices"][0]["message"]["content"]
        raw_result = _parse_qwen_result(raw_text)
        result = _apply_v1_minimum_floor(raw_result, payload)
        return Lesson3AiReviewResponse(
            requestId=f"qwen_lesson3_{payload.kind}_{uuid4().hex[:12]}",
            provider="qwen",
            reviewedAt=_now_iso(),
            result=result,
        )

def get_lesson3_ai_review_provider() -> Lesson3AiReviewProvider:
    """按环境变量选择 provider；默认 mock。"""
    provider = os.getenv("LESSON3_AI_REVIEW_PROVIDER", "mock").lower()
    if provider == "qwen":
        return QwenLesson3AiReviewProvider()
    return MockLesson3AiReviewProvider()

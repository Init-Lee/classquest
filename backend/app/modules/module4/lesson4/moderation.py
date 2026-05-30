"""
文件说明：模块 4 课时 4 互审文字 AI/规则审核。
职责：在提交审查前检测粗俗暴力、无意义灌水与过短评价；支持 mock 与 Qwen provider，复用 DashScope 环境变量。
更新触发：审核 prompt、输出解析、provider 选择、fieldKey 契约或 mock/规则阈值变化时，需要同步更新本文件。
"""

from __future__ import annotations

import json
import logging
import os
import re
from difflib import SequenceMatcher
from typing import Literal, Protocol

from ..shared.qwen_http import QwenHttpError, qwen_chat_json, read_dashscope_api_key

from .schemas import (
    Lesson4ModerateTextCardKey,
    Lesson4ModerateTextCardResult,
    Lesson4ModerateTextFieldResult,
    Lesson4ModerateTextItem,
    Lesson4ModerateTextResponse,
)

Lesson4ModerationProviderName = Literal["mock", "qwen"]

logger = logging.getLogger(__name__)

_MIN_MEANINGFUL_CHARS = 4
_MIN_OVERALL_COMMENT_CHARS = 1
_MIN_CONSECUTIVE_UNIT_REPEATS = 3
_PROFANITY_HINTS = ("傻逼", "操你", "去死", "滚蛋", "妈的", "他妈")
# AI 不通过理由须指向「评语本身」违规，而非继续给题卡作者提修改建议。
_COMMENT_VIOLATION_KEYWORDS = (
    "不文明",
    "不当",
    "灌水",
    "重复",
    "敷衍",
    "过短",
    "无意义",
    "违规",
    "暴力",
    "歧视",
    "辱骂",
    "粗俗",
    "违法",
    "为空",
    "空白",
    "实质",
)
_RUBRIC_PREFIX_PATTERN = re.compile(r"^【[^】]{1,24}】")
_RUBRIC_LEVEL_PATTERN = re.compile(r"^【[^】]*·([^】]+)】")


class Lesson4ModerationProviderError(RuntimeError):
    """审核 provider 可定位错误，不包含密钥。"""


def _normalize_content(value: str) -> str:
    return " ".join(value.strip().split())


def _strip_rubric_prefix(content: str) -> str:
    """去掉【来源·小修】等量纲前缀，便于判断正文与 AI 理由是否在复述评语。"""
    stripped = content.strip()
    while True:
        match = _RUBRIC_PREFIX_PATTERN.match(stripped)
        if not match:
            break
        stripped = stripped[match.end() :].lstrip()
    return stripped


def _compact_review_body(body: str) -> str:
    return re.sub(r"[\s\W_]+", "", body, flags=re.UNICODE)


def _has_meaningless_repetition(body: str) -> bool:
    compact = _compact_review_body(body)
    if len(compact) < _MIN_CONSECUTIVE_UNIT_REPEATS:
        return False
    if re.search(r"(.)\1{2,}", compact):
        return True
    max_unit_len = len(compact) // _MIN_CONSECUTIVE_UNIT_REPEATS
    for unit_len in range(1, max_unit_len + 1):
        unit = compact[:unit_len]
        if re.search(rf"(?:{re.escape(unit)}){{{_MIN_CONSECUTIVE_UNIT_REPEATS},}}", compact):
            return True
    return False


def _has_low_information_entropy(body: str) -> bool:
    compact = _compact_review_body(body)
    if len(compact) < 6:
        return False
    return len(set(compact)) <= 2


def _extract_rubric_level(content: str) -> str | None:
    match = _RUBRIC_LEVEL_PATTERN.match(content.strip())
    return match.group(1).strip() if match else None


def _is_pass_level_content(content: str) -> bool:
    level = _extract_rubric_level(content)
    if not level:
        return False
    normalized = level.lower()
    return normalized in ("pass", "通过")


def _detect_meaningless_review_body(content: str) -> str | None:
    body = _strip_rubric_prefix(content)
    if not body.strip():
        return None
    if _has_meaningless_repetition(body) or _has_low_information_entropy(body):
        if _is_pass_level_content(content):
            return "评语无实质内容，通过档位需写明具体肯定理由。"
        return "存在无意义重复或灌水，请改写。"
    if _is_pass_level_content(content):
        meaningful = re.sub(r"[\s\d\W_]+", "", body, flags=re.UNICODE)
        if len(meaningful) < _MIN_MEANINGFUL_CHARS:
            return "评语无实质内容，通过档位需写明具体肯定理由。"
    return None


def _is_overall_comment_field(field_key: str) -> bool:
    return field_key.endswith(".overallComment")


def _rule_check_text(content: str, field_key: str | None = None) -> list[str]:
    """本地规则预审：过短、重复短语/字符、低信息熵、通过档位无实质内容、明显不文明词。"""
    normalized = _normalize_content(content)
    if not normalized:
        return ["内容为空，请填写具体评价。"]
    reasons: list[str] = []
    body_for_length = _strip_rubric_prefix(normalized)
    meaningful = re.sub(r"[\s\d\W_]+", "", body_for_length, flags=re.UNICODE)
    min_chars = (
        _MIN_OVERALL_COMMENT_CHARS
        if field_key and _is_overall_comment_field(field_key)
        else _MIN_MEANINGFUL_CHARS
    )
    if len(meaningful) < min_chars:
        if field_key and _is_overall_comment_field(field_key):
            reasons.append("请填写总体建议。")
        else:
            reasons.append("评价过短或缺少有效文字，请写清具体理由。")
    meaningless_reason = _detect_meaningless_review_body(normalized)
    if meaningless_reason:
        reasons.append(meaningless_reason)
    lowered = normalized.lower()
    for hint in _PROFANITY_HINTS:
        if hint in lowered or hint in normalized:
            reasons.append("含有不文明或不当用语，请修改后重试。")
            break
    return reasons


LESSON4_MODERATION_SYSTEM_PROMPT = """
你是 K12 课堂「同伴互审」的合规审核助手，只审核「审查者写给题卡作者」的评语文字，不审核题卡本身。

## 待审文字是什么
- 审查者对同学题卡某一项的说明（常见前缀如【来源·小修】【素材·小修】+ 原因），或总体建议。
- 评语里可以正常要求作者改题卡，例如「来源不清楚，请补充网页出处」「建议罗列对应网页」——这是合格互审，应判通过。

## 你只拦这些情况（评语本身有问题）
1. 粗俗、暴力、歧视、辱骂、违法违规等不当用语；
2. 无意义灌水：纯重复字符或短语（如 aaaaaa、111111、啊啊啊、下次下次下次）、同一字/词连续重复 3 次及以上、有效信息熵过低（去掉【维度·档位】前缀后只剩重复短词）、明显敷衍（如单独「随便」）；
3. 过短：去掉标点后有效文字不足 4 字（总体建议字段仅要求非空）；
4. 与档位矛盾：选「通过/pass」但原因无具体肯定内容（如【任务·通过】下次下次下次）——评语无实质内容，应判不通过。

## 严禁误判为不通过
- 不要把评语理解成「审查者自己的作业」：不要要求审查者去补链接、改题卡、重写题目。
- 不要把「请作者补充来源/出处/链接」类正常互审句判为不通过。
- 不要用改写、复述用户评语当作不通过原因（如用户写「可以罗列网页出处」，reason 不能写成「建议补充网页出处」）。

## 不通过时 reasons 怎么写
- 只说明「这段评语」为何违规，例如：「属于无意义重复字符」「含有不文明用语」「有效文字过短」「评语无实质内容」。
- 禁止在 reasons 里继续给学生提修改题卡的建议。

## 通过
真诚、具体、可交给作者阅读的中文互审即可，长短适中均可。

只输出 JSON（不要 markdown）：
{"results":[{"fieldKey":"news.material.reason","pass":true,"reasons":[]},{"fieldKey":"news.source.reason","pass":false,"reasons":["属于无意义重复字符"]}]}
fieldKey 必须与输入完全一致；不通过时 reasons 最多 1~2 句；通过时 reasons 为 []。
""".strip()


class Lesson4ModerationProvider(Protocol):
    async def moderate(self, texts: list[Lesson4ModerateTextItem]) -> Lesson4ModerateTextResponse:
        ...


def _aggregate_by_card(
    by_field: dict[str, Lesson4ModerateTextFieldResult],
    texts: list[Lesson4ModerateTextItem],
) -> dict[Lesson4ModerateTextCardKey, Lesson4ModerateTextCardResult]:
    """将字段级结果聚合为题卡级视图，供旧客户端兼容。"""
    by_card: dict[Lesson4ModerateTextCardKey, Lesson4ModerateTextCardResult] = {}
    for item in texts:
        field_result = by_field.get(item.fieldKey)
        if field_result is None:
            continue
        existing = by_card.get(item.card)
        if existing is None:
            by_card[item.card] = Lesson4ModerateTextCardResult(
                pass_=field_result.pass_,
                reasons=list(field_result.reasons),
            )
            continue
        merged_reasons = list(existing.reasons)
        for reason in field_result.reasons:
            if reason not in merged_reasons:
                merged_reasons.append(reason)
        by_card[item.card] = Lesson4ModerateTextCardResult(
            pass_=existing.pass_ and field_result.pass_,
            reasons=merged_reasons,
        )
    return by_card


def _merge_rule_and_ai(
    texts: list[Lesson4ModerateTextItem],
    ai_by_field: dict[str, tuple[bool, list[str]]] | None,
) -> Lesson4ModerateTextResponse:
    by_field: dict[str, Lesson4ModerateTextFieldResult] = {}
    for item in texts:
        local_reasons = _rule_check_text(item.content, item.fieldKey)
        reasons = list(local_reasons)
        if ai_by_field and item.fieldKey in ai_by_field:
            ai_pass, ai_reasons = ai_by_field[item.fieldKey]
            sanitized_pass, sanitized_reasons = _sanitize_ai_field_result(
                item.content,
                ai_pass,
                ai_reasons,
                local_reasons,
            )
            if not sanitized_pass:
                for reason in sanitized_reasons:
                    if reason not in reasons:
                        reasons.append(reason)
        by_field[item.fieldKey] = Lesson4ModerateTextFieldResult(pass_=len(reasons) == 0, reasons=reasons)
    overall_pass = all(result.pass_ for result in by_field.values())
    by_card = _aggregate_by_card(by_field, texts)
    return Lesson4ModerateTextResponse(pass_=overall_pass, byField=by_field, byCard=by_card)


class MockLesson4ModerationProvider:
    """默认 mock：规则预审 + 可配置整批失败（联调）。"""

    async def moderate(self, texts: list[Lesson4ModerateTextItem]) -> Lesson4ModerateTextResponse:
        force_fail = os.getenv("LESSON4_REVIEW_MODERATION_MOCK_OUTCOME", "pass").lower() == "fail"
        if force_fail:
            ai_by_field = {
                item.fieldKey: (False, ["模拟审核不通过，请改写评价内容。"])
                for item in texts
            }
            return _merge_rule_and_ai(texts, ai_by_field)
        return _merge_rule_and_ai(texts, None)


def _normalize_for_similarity(value: str) -> str:
    return re.sub(r"[\s\W_]+", "", value, flags=re.UNICODE).lower()


def _reason_echoes_user_content(content: str, reason: str) -> bool:
    """AI 理由是否在略改复述用户评语（应丢弃，避免误杀正常互审）。"""
    body = _strip_rubric_prefix(content)
    if not body.strip() or not reason.strip():
        return False
    norm_body = _normalize_for_similarity(body)
    norm_reason = _normalize_for_similarity(reason)
    if not norm_body or not norm_reason:
        return False
    if norm_reason in norm_body or norm_body in norm_reason:
        return True
    return SequenceMatcher(None, norm_body, norm_reason).ratio() >= 0.62


def _ai_reasons_indicate_comment_violation(reasons: list[str]) -> bool:
    joined = "".join(reasons)
    return any(keyword in joined for keyword in _COMMENT_VIOLATION_KEYWORDS)


def _sanitize_ai_field_result(
    content: str,
    ai_pass: bool,
    ai_reasons: list[str],
    local_reasons: list[str],
) -> tuple[bool, list[str]]:
    """
    过滤复述评语或「让审查者改题卡」类 AI 误判。
    本地规则已不通过时保留 AI 补充；否则仅保留指向评语本身违规的理由。
    """
    if ai_pass:
        return True, []
    filtered: list[str] = []
    for reason in ai_reasons:
        stripped = reason.strip()
        if not stripped or _reason_echoes_user_content(content, stripped):
            continue
        filtered.append(stripped)
    if local_reasons:
        return False, filtered
    if not filtered:
        return True, []
    if not _ai_reasons_indicate_comment_violation(filtered):
        return True, []
    return False, filtered


def _build_user_prompt(texts: list[Lesson4ModerateTextItem]) -> str:
    lines = [
        "以下每段文字都是「审查者写给题卡作者」的互审评语（不是题卡正文）。",
        "请只判断评语是否合规：不文明、无意义灌水（含短语/字重复 3+ 次、低信息熵）、过短、通过档位无实质肯定内容；不要把「请作者补充来源/链接」判为不通过。",
        "逐条返回 fieldKey 对应结果：",
    ]
    for index, item in enumerate(texts, start=1):
        lines.append(f"{index}. fieldKey={item.fieldKey} [{item.card}] {item.label}")
        lines.append(item.content.strip() or "（空）")
        lines.append("")
    return "\n".join(lines)


def _parse_qwen_results(
    raw_text: str,
    expected_field_keys: set[str],
) -> dict[str, tuple[bool, list[str]]]:
    try:
        payload = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        preview = raw_text[:300].replace("\n", " ")
        logger.warning("Lesson4 moderation JSON 解析失败: %s; raw preview: %s", exc, preview)
        raise Lesson4ModerationProviderError("AI 返回格式无法解析，请稍后重试。") from exc

    results = payload.get("results")
    if not isinstance(results, list):
        logger.warning(
            "Lesson4 moderation 缺少 results 字段; payload keys=%s; preview=%s",
            list(payload.keys()) if isinstance(payload, dict) else type(payload).__name__,
            raw_text[:300].replace("\n", " "),
        )
        raise Lesson4ModerationProviderError("AI 返回缺少 results 字段。")

    parsed: dict[str, tuple[bool, list[str]]] = {}
    for entry in results:
        if not isinstance(entry, dict):
            continue
        field_key = entry.get("fieldKey")
        if not isinstance(field_key, str) or field_key not in expected_field_keys:
            continue
        pass_value = bool(entry.get("pass", True))
        raw_reasons = entry.get("reasons")
        reasons: list[str] = []
        if isinstance(raw_reasons, list):
            reasons = [str(reason).strip() for reason in raw_reasons if str(reason).strip()]
        else:
            legacy_reason = str(entry.get("reason") or "").strip()
            if legacy_reason:
                reasons = [legacy_reason]
        parsed[field_key] = (pass_value, reasons)

    missing = expected_field_keys - set(parsed.keys())
    if missing:
        logger.warning(
            "Lesson4 moderation AI 未返回部分 fieldKey: %s",
            sorted(missing),
        )
    return parsed


class QwenLesson4ModerationProvider:
    """Qwen Chat Completions 批量审核。"""

    async def moderate(self, texts: list[Lesson4ModerateTextItem]) -> Lesson4ModerateTextResponse:
        timeout = float(
            os.getenv("LESSON4_REVIEW_MODERATION_TIMEOUT_SECONDS")
            or os.getenv("LESSON3_AI_REVIEW_TIMEOUT_SECONDS", "25")
        )
        max_tokens = int(
            os.getenv("LESSON4_REVIEW_MODERATION_MAX_TOKENS")
            or os.getenv("QWEN_MAX_TOKENS", "400")
        )
        try:
            raw_text = await qwen_chat_json(
                system_prompt=LESSON4_MODERATION_SYSTEM_PROMPT,
                user_prompt=_build_user_prompt(texts),
                max_tokens=max_tokens,
                timeout_seconds=timeout,
                temperature=0.1,
            )
        except QwenHttpError as exc:
            raise Lesson4ModerationProviderError(str(exc)) from exc

        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(
                "Lesson4 moderation Qwen raw response preview: %s",
                raw_text[:500].replace("\n", " "),
            )

        expected = {item.fieldKey for item in texts}
        ai_by_field = _parse_qwen_results(raw_text, expected)
        return _merge_rule_and_ai(texts, ai_by_field)


def _resolve_lesson4_provider_name() -> Lesson4ModerationProviderName:
    """显式 mock/qwen；未设置时与 lesson3 共用 DASHSCOPE_API_KEY，有 key 则 qwen。"""
    explicit = os.getenv("LESSON4_REVIEW_MODERATION_PROVIDER", "").strip().lower()
    if explicit == "mock":
        return "mock"
    if explicit == "qwen":
        return "qwen"
    try:
        if read_dashscope_api_key():
            return "qwen"
    except QwenHttpError as exc:
        raise Lesson4ModerationProviderError(str(exc)) from exc
    return "mock"


def get_lesson4_moderation_provider() -> Lesson4ModerationProvider:
    provider = _resolve_lesson4_provider_name()
    if provider == "qwen":
        return QwenLesson4ModerationProvider()
    return MockLesson4ModerationProvider()

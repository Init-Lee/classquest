"""
文件说明：模块 4 课时 6 匿名公共挑战服务。
职责：从全局公共题库抽取 6 题、创建匿名 run、返回下一题、处理幂等作答并更新公共题卡统计，确保未作答前不泄露答案/解析/来源/作者身份。
更新触发：公共挑战抽样规则、runtime 隐私策略、作答幂等规则、reveal 字段或 summary 契约变化时，需要同步更新本文件。
"""

from __future__ import annotations

from collections.abc import Iterable
from datetime import timedelta
import copy
import hashlib
import json
import random
import secrets
import sqlite3
from typing import Any

from app.core.database import database_transaction
from app.modules.module4.lesson5.auth import server_now, to_iso8601

from . import repository, stats_service
from .schemas import (
    PublicChallengeAnswerRequest,
    PublicChallengeAnswerResponse,
    PublicChallengeCurrentQuestionResponse,
    PublicChallengeNextDto,
    PublicChallengeProgressDto,
    PublicChallengeRunCreateResponse,
    PublicChallengeSummaryResponse,
)

VALID_CONTEXTS = {"lesson6_class", "public_showcase"}
QUESTION_COUNT = 6
TARGET_PER_KIND = 3
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_RUNS = 20
_HASH_PREFIX = "classquest-lesson6-public"
_PUBLIC_SENSITIVE_KEYS = {
    "correctOptionKey",
    "correctAnswer",
    "answer",
    "isCorrect",
    "correct",
    "explanation",
    "explanationText",
    "source",
    "sourceRecord",
    "verificationNote",
    "author",
    "authorName",
    "authorSeatCode",
    "student",
    "studentName",
    "classId",
    "className",
}


class Lesson6ChallengeError(Exception):
    """Lesson6 公共挑战业务错误，供 routes 转换为 HTTP 状态码。"""

    def __init__(
        self,
        message: str,
        status_code: int = 400,
        *,
        error: str | None = None,
        available_count: int | None = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.error = error
        self.available_count = available_count


def hash_runtime_value(value: str | None) -> str | None:
    """把匿名会话、IP 或 UA 转成不可逆哈希；空值保持为空。"""
    if value is None:
        return None
    normalized = value.strip()
    if not normalized:
        return None
    digest = hashlib.sha256(f"{_HASH_PREFIX}:{normalized}".encode("utf-8")).hexdigest()
    return digest


def _generate_run_id() -> str:
    """生成公共挑战 run 主键。"""
    return f"l6run_{secrets.token_hex(8)}"


def _generate_run_item_id(run_id: str, item_version_id: str) -> str:
    """根据 run 与版本生成稳定 run_item 主键，便于测试定位。"""
    digest = hashlib.sha256(f"{run_id}:{item_version_id}".encode("utf-8")).hexdigest()
    return f"l6ri_{digest[:16]}"


def _generate_answer_id() -> str:
    """生成公共挑战 answer 主键。"""
    return f"l6ans_{secrets.token_hex(8)}"


def _ensure_context(context: str) -> str:
    """校验公共挑战 context，避免写入未知统计维度。"""
    normalized = context.strip()
    if normalized not in VALID_CONTEXTS:
        raise Lesson6ChallengeError(f"不支持的公共挑战 context：{context}。", 400)
    return normalized


def _tie_breaker(rng: random.Random, row: sqlite3.Row) -> float:
    """生成抽样随机 tie-break；row 参数保留给排序 key 读者理解来源。"""
    _ = row
    return rng.random()


def select_public_questions(rows: Iterable[sqlite3.Row], *, seed: int | None = None) -> list[sqlite3.Row]:
    """按 3 news + 3 image、低曝光优先与随机 tie-break 选择 6 题。"""
    all_rows = list(rows)
    if len(all_rows) < QUESTION_COUNT:
        raise Lesson6ChallengeError(
            "公开题库题目暂时不足 6 题，请稍后再试。",
            409,
            error="public_bank_not_ready",
            available_count=len(all_rows),
        )
    rng = random.Random(seed)
    grouped: dict[str, list[sqlite3.Row]] = {"news": [], "image": []}
    for row in all_rows:
        if row["card_kind"] in grouped:
            grouped[row["card_kind"]].append(row)

    ranked = {
        kind: sorted(
            kind_rows,
            key=lambda row: (
                int(row["total_answer_count"] or 0),
                _tie_breaker(rng, row),
                row["item_version_id"],
            ),
        )
        for kind, kind_rows in grouped.items()
    }
    selected: list[sqlite3.Row] = []
    selected.extend(ranked["news"][:TARGET_PER_KIND])
    selected.extend(ranked["image"][:TARGET_PER_KIND])
    selected_versions = {row["item_version_id"] for row in selected}
    if len(selected) < QUESTION_COUNT:
        leftovers = [
            row
            for row in sorted(
                all_rows,
                key=lambda candidate: (
                    int(candidate["total_answer_count"] or 0),
                    _tie_breaker(rng, candidate),
                    candidate["item_version_id"],
                ),
            )
            if row_not_selected(row, selected_versions)
        ]
        selected.extend(leftovers[: QUESTION_COUNT - len(selected)])
    return selected[:QUESTION_COUNT]


def row_not_selected(row: sqlite3.Row, selected_versions: set[str]) -> bool:
    """判断候选题卡版本是否尚未进入本轮 run。"""
    return row["item_version_id"] not in selected_versions


def _load_card_json(row: sqlite3.Row) -> dict[str, Any]:
    """解析题卡 JSON，格式异常时返回可定位 409。"""
    try:
        value = json.loads(row["card_json"])
    except json.JSONDecodeError as exc:
        raise Lesson6ChallengeError(f"题卡 JSON 无法解析：itemVersionId={row['item_version_id']}。", 409) from exc
    if not isinstance(value, dict):
        raise Lesson6ChallengeError(f"题卡 JSON 格式错误：itemVersionId={row['item_version_id']}。", 409)
    return value


def _strip_sensitive(value: Any) -> Any:
    """递归移除公共题目未作答前不能暴露的答案、来源与作者身份字段。"""
    if isinstance(value, dict):
        return {
            key: _strip_sensitive(child)
            for key, child in value.items()
            if key not in _PUBLIC_SENSITIVE_KEYS
        }
    if isinstance(value, list):
        return [_strip_sensitive(child) for child in value]
    return copy.deepcopy(value)


def _public_question_response(
    *,
    run: sqlite3.Row,
    run_item: sqlite3.Row | None,
    answered_count: int,
) -> PublicChallengeCurrentQuestionResponse:
    """把下一题 run_item 装配为学生/访客可见响应。"""
    if run_item is None:
        return PublicChallengeCurrentQuestionResponse(
            runId=run["run_id"],
            questionCount=int(run["question_count"]),
            answeredCount=answered_count,
            completed=True,
        )
    card = _load_card_json(run_item)
    material = _strip_sensitive(card.get("material") if isinstance(card.get("material"), dict) else {})
    task = _strip_sensitive(card.get("task") if isinstance(card.get("task"), dict) else {})
    return PublicChallengeCurrentQuestionResponse(
        runId=run["run_id"],
        runItemId=run_item["run_item_id"],
        orderIndex=int(run_item["order_index"]),
        questionCount=int(run["question_count"]),
        answeredCount=answered_count,
        completed=False,
        kind=run_item["card_kind"],
        material=material if isinstance(material, dict) else {},
        task=task if isinstance(task, dict) else {},
    )


def _task_from_card(card: dict[str, Any], run_item_id: str) -> dict[str, Any]:
    """读取题卡 task；格式错误时给出 run_item 级定位。"""
    task = card.get("task")
    if not isinstance(task, dict):
        raise Lesson6ChallengeError(f"题卡缺少有效 task：runItemId={run_item_id}。", 409)
    return task


def _legal_option_keys(task: dict[str, Any], run_item_id: str) -> set[str]:
    """从 task.options 中提取可提交选项 key。"""
    options = task.get("options")
    if not isinstance(options, list):
        raise Lesson6ChallengeError(f"题卡缺少有效 options：runItemId={run_item_id}。", 409)
    keys: set[str] = set()
    for option in options:
        if isinstance(option, dict) and isinstance(option.get("key"), str):
            key = option["key"].strip()
            if key:
                keys.add(key)
    if not keys:
        raise Lesson6ChallengeError(f"题卡没有可提交选项：runItemId={run_item_id}。", 409)
    return keys


def _text_from_dict(value: Any, *keys: str) -> str:
    """按候选 key 从对象中提取非空文本。"""
    if not isinstance(value, dict):
        return ""
    for key in keys:
        text = value.get(key)
        if isinstance(text, str) and text.strip():
            return text.strip()
    return ""


def _explanation_from_card(card: dict[str, Any], task: dict[str, Any]) -> dict[str, Any]:
    """从题卡中归一化作答后 reveal 的 explanation 对象。"""
    raw = task.get("explanation")
    if isinstance(raw, dict):
        return copy.deepcopy(raw)
    if isinstance(raw, str) and raw.strip():
        return {"text": raw.strip()}
    text = task.get("explanationText")
    if isinstance(text, str) and text.strip():
        return {"text": text.strip()}
    card_explanation = card.get("explanation")
    if isinstance(card_explanation, dict):
        return copy.deepcopy(card_explanation)
    return {"text": _text_from_dict(card_explanation, "text", "summary")}


def _source_from_card(card: dict[str, Any], task: dict[str, Any]) -> Any:
    """从题卡中归一化作答后 reveal 的 source 字段。"""
    source = task.get("source")
    if source is None:
        source = task.get("sourceRecord")
    if source is None:
        source = task.get("verificationNote")
    if source is None:
        source = card.get("source")
    if isinstance(source, dict):
        clean_source = copy.deepcopy(source)
        for key in ("authorName", "authorSeatCode", "classId", "className", "student", "studentName"):
            clean_source.pop(key, None)
        return clean_source
    return source


def _answer_response(
    *,
    answer: sqlite3.Row,
    run_item: sqlite3.Row,
    answered_count: int,
    next_order_index: int | None,
) -> PublicChallengeAnswerResponse:
    """把 answer、题卡和进度装配为作答揭示响应。"""
    card = _load_card_json(run_item)
    task = _task_from_card(card, run_item["run_item_id"])
    return PublicChallengeAnswerResponse(
        isCorrect=bool(answer["is_correct"]),
        correctOptionKey=answer["correct_option_key"],
        explanation=_explanation_from_card(card, task),
        source=_source_from_card(card, task),
        progress=PublicChallengeProgressDto(
            answeredCount=answered_count,
            questionCount=int(run_item["question_count"]),
        ),
        next=PublicChallengeNextDto(
            hasNext=next_order_index is not None,
            nextOrderIndex=next_order_index,
        ),
    )


def create_run(
    *,
    context: str,
    anon_session_id: str | None,
    ip_address: str | None,
    user_agent: str | None,
    seed: int | None = None,
) -> PublicChallengeRunCreateResponse:
    """创建公共挑战 run 并持久化 6 条 run_item。"""
    normalized_context = _ensure_context(context)
    now_dt = server_now()
    now = to_iso8601(now_dt)
    anon_hash = hash_runtime_value(anon_session_id or "anonymous")
    ip_hash = hash_runtime_value(ip_address)
    ua_hash = hash_runtime_value(user_agent)
    if anon_hash is None:
        raise Lesson6ChallengeError("匿名会话标识生成失败。", 400)

    with database_transaction() as connection:
        available_rows = repository.list_public_bank_questions(connection)
        selected_rows = select_public_questions(available_rows, seed=seed)
        window_start = to_iso8601(now_dt - timedelta(seconds=RATE_LIMIT_WINDOW_SECONDS))
        recent_count = repository.count_recent_public_challenge_runs(
            connection,
            anon_session_hash=anon_hash,
            ip_hash=ip_hash,
            started_after=window_start,
        )
        if recent_count >= RATE_LIMIT_MAX_RUNS:
            raise Lesson6ChallengeError("公共挑战创建过于频繁，请稍后再试。", 429)
        run_id = _generate_run_id()
        repository.insert_public_challenge_run(
            connection,
            run_id=run_id,
            context=normalized_context,
            anon_session_hash=anon_hash,
            question_count=QUESTION_COUNT,
            started_at=now,
            user_agent_hash=ua_hash,
            ip_hash=ip_hash,
        )
        for order_index, row in enumerate(selected_rows, start=1):
            repository.insert_public_challenge_run_item(
                connection,
                run_item_id=_generate_run_item_id(run_id, row["item_version_id"]),
                run_id=run_id,
                item_id=row["item_id"],
                item_version_id=row["item_version_id"],
                card_kind=row["card_kind"],
                order_index=order_index,
                assigned_at=now,
            )

    return PublicChallengeRunCreateResponse(
        runId=run_id,
        context=normalized_context,  # type: ignore[arg-type]
        questionCount=QUESTION_COUNT,
        startedAt=now,
    )


def get_current_question(run_id: str) -> PublicChallengeCurrentQuestionResponse:
    """返回下一道未作答题；run 完成后返回 completed=true。"""
    with database_transaction() as connection:
        run = repository.get_public_challenge_run(connection, run_id)
        if run is None:
            raise Lesson6ChallengeError(f"公共挑战 run 不存在：runId={run_id}。", 404)
        answered_count = repository.count_answered_run_items(connection, run_id)
        run_item = repository.get_next_unanswered_run_item(connection, run_id)
    return _public_question_response(run=run, run_item=run_item, answered_count=answered_count)


def submit_answer(
    *,
    run_id: str,
    payload: PublicChallengeAnswerRequest,
) -> PublicChallengeAnswerResponse:
    """提交公共挑战 answer；重复提交同 run_item 幂等返回既有 reveal 且不重复统计。"""
    selected_option_key = payload.selectedOptionKey.strip()
    if not selected_option_key:
        raise Lesson6ChallengeError("selectedOptionKey 不能为空。")
    now = to_iso8601(server_now())
    with database_transaction() as connection:
        run = repository.get_public_challenge_run(connection, run_id)
        if run is None:
            raise Lesson6ChallengeError(f"公共挑战 run 不存在：runId={run_id}。", 404)
        run_item = repository.get_public_challenge_run_item_detail(
            connection,
            run_id=run_id,
            run_item_id=payload.runItemId.strip(),
        )
        if run_item is None:
            raise Lesson6ChallengeError(f"公共挑战题目不存在或不属于该 run：runItemId={payload.runItemId}。", 404)
        existing = repository.get_public_challenge_answer_by_run_item(connection, run_item["run_item_id"])
        if existing is not None:
            answered_count = repository.count_answered_run_items(connection, run_id)
            next_order_index = repository.get_public_challenge_next_order_index(connection, run_id)
            return _answer_response(
                answer=existing,
                run_item=run_item,
                answered_count=answered_count,
                next_order_index=next_order_index,
            )

        card = _load_card_json(run_item)
        task = _task_from_card(card, run_item["run_item_id"])
        if selected_option_key not in _legal_option_keys(task, run_item["run_item_id"]):
            raise Lesson6ChallengeError(
                f"selectedOptionKey 不属于该题选项：runItemId={run_item['run_item_id']} selectedOptionKey={selected_option_key}。",
                400,
            )
        correct_option_key = str(run_item["correct_option_key"] or "").strip()
        if not correct_option_key:
            raise Lesson6ChallengeError(f"题卡标准答案缺失：itemVersionId={run_item['item_version_id']}。", 409)
        is_correct = selected_option_key == correct_option_key
        repository.insert_public_challenge_answer(
            connection,
            answer_id=_generate_answer_id(),
            run_id=run_id,
            run_item_id=run_item["run_item_id"],
            item_id=run_item["item_id"],
            item_version_id=run_item["item_version_id"],
            context=run_item["context"],
            selected_option_key=selected_option_key,
            correct_option_key=correct_option_key,
            is_correct=is_correct,
            duration_ms=payload.durationMs,
            answered_at=now,
        )
        repository.mark_public_challenge_run_item_answered(
            connection,
            run_item_id=run_item["run_item_id"],
            answered_at=now,
        )
        stats_service.increment_question_stats(
            connection,
            item_id=run_item["item_id"],
            item_version_id=run_item["item_version_id"],
            context=run_item["context"],
            is_correct=is_correct,
            answered_at=now,
        )
        inserted = repository.get_public_challenge_answer_by_run_item(connection, run_item["run_item_id"])
        if inserted is None:
            raise Lesson6ChallengeError("answer 写入后无法读取。", 500)
        answered_count = repository.count_answered_run_items(connection, run_id)
        next_order_index = repository.get_public_challenge_next_order_index(connection, run_id)
        if next_order_index is None:
            repository.mark_public_challenge_run_completed(connection, run_id=run_id, completed_at=now)

    return _answer_response(
        answer=inserted,
        run_item=run_item,
        answered_count=answered_count,
        next_order_index=next_order_index,
    )


def get_summary(run_id: str) -> PublicChallengeSummaryResponse:
    """读取公共挑战 run 摘要。"""
    with database_transaction() as connection:
        row = repository.get_public_challenge_summary(connection, run_id)
        if row is None:
            raise Lesson6ChallengeError(f"公共挑战 run 不存在：runId={run_id}。", 404)
    answered_count = int(row["answered_count"] or 0)
    question_count = int(row["question_count"] or 0)
    return PublicChallengeSummaryResponse(
        runId=row["run_id"],
        completed=bool(row["completed_at"]) or answered_count >= question_count,
        questionCount=question_count,
        answeredCount=answered_count,
        context=row["context"],
        completedAt=row["completed_at"],
    )

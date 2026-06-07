"""
文件说明：模块 4 课时 5 fixture 来源检视脚本。
职责：读取学生 portfolio JSON 与课时 4 云端互审快照，识别 lesson4 ready 包、v2 卡片和 cloud cards 的真实形状，输出 C0 核对报告与 seed 可读的归一化 V2 提交包。
更新触发：学生包结构、云端快照结构、class_id 映射、报告字段或 seed 输入格式变化时，需要同步更新本文件。
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

BACKEND_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ROOT = BACKEND_ROOT / "runtime" / "fixtures" / "module4" / "lesson5"
READY_PACKAGE_VERSION = "lesson4-ready-for-lesson5-v1"

READY_PACKAGE_PATHS = [
    ["portfolio", "lesson4", "readiness", "exportedPackageJson"],
    ["lesson4", "readiness", "exportedPackageJson"],
]
V2_CARD_PATHS = [
    ["portfolio", "lesson4", "v2"],
    ["lesson4", "v2"],
]
CARD_KINDS = ("news", "image")


def load_json(path: Path) -> Any:
    """读取 JSON 文件；异常交给调用方记录到报告中。"""
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    """以稳定、可人工审阅的格式写出 JSON。"""
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")


def get_path(obj: Any, path: list[str]) -> Any:
    """按路径安全读取嵌套字段。"""
    current = obj
    for key in path:
        if not isinstance(current, dict) or key not in current:
            return None
        current = current[key]
    return current


def normalize_card_kind(kind: str) -> str:
    """把 v2 路径中的 newsCard/imageCard 归一成 news/image。"""
    if kind == "newsCard":
        return "news"
    if kind == "imageCard":
        return "image"
    return kind


def iter_json_files(folder: Path) -> list[Path]:
    """列出目录中的 JSON 文件；目录不存在时返回空列表。"""
    if not folder.exists():
        return []
    return sorted(path for path in folder.glob("*.json") if path.is_file())


def parse_class_number_from_text(value: str | None) -> str | None:
    """从 class-03、初一（3）班、0310 等班级文本中提取两位班号。"""
    if not value:
        return None
    stripped = value.strip()
    match = re.search(r"class-(\d{1,2})", stripped, re.IGNORECASE)
    if match:
        return match.group(1).zfill(2)
    match = re.search(r"[（(](\d{1,2})[）)]班", stripped)
    if match:
        return match.group(1).zfill(2)
    if re.fullmatch(r"\d{4}", stripped):
        return stripped[:2]
    return None


def coerce_class_id(clazz: str | None = None, class_seat_code: str | None = None, cloud_class_id: str | None = None) -> str | None:
    """把真实来源中的班级口径归一成开发样本使用的 g7cNN。"""
    class_number = (
        parse_class_number_from_text(cloud_class_id)
        or parse_class_number_from_text(clazz)
        or parse_class_number_from_text(class_seat_code)
    )
    if not class_number:
        return None
    return f"g7c{class_number}"


def find_ready_package(obj: Any) -> tuple[dict[str, Any] | None, str | None]:
    """识别 lesson4-ready-for-lesson5-v1 包及其路径。"""
    if isinstance(obj, dict) and obj.get("packageVersion") == READY_PACKAGE_VERSION:
        return obj, "$"
    for path in READY_PACKAGE_PATHS:
        value = get_path(obj, path)
        if isinstance(value, dict) and value.get("packageVersion") == READY_PACKAGE_VERSION:
            return value, ".".join(path)
    return None, None


def find_v2_cards(obj: Any) -> tuple[dict[str, Any], str | None]:
    """识别 portfolio.lesson4.v2 或 lesson4.v2 中的 newsCard/imageCard。"""
    for path in V2_CARD_PATHS:
        value = get_path(obj, path)
        if not isinstance(value, dict):
            continue
        cards: dict[str, Any] = {}
        for raw_kind, card in value.items():
            kind = normalize_card_kind(raw_kind)
            if kind in CARD_KINDS and isinstance(card, dict):
                cards[kind] = card
        if cards:
            return cards, ".".join(path)
    return {}, None


def summarize_asset(card: dict[str, Any]) -> dict[str, Any]:
    """提取素材 asset 是否为 dataUrl，避免报告直接展开大字段。"""
    material = card.get("material") if isinstance(card.get("material"), dict) else {}
    asset = material.get("asset") if isinstance(material, dict) and isinstance(material.get("asset"), dict) else {}
    data_url = asset.get("dataUrl") if isinstance(asset, dict) else None
    return {
        "assetType": "dataUrl" if isinstance(data_url, str) and data_url.startswith("data:") else "reference_or_missing",
        "hasDataUrl": isinstance(data_url, str) and data_url.startswith("data:"),
        "dataUrlLength": len(data_url) if isinstance(data_url, str) else 0,
        "mimeType": asset.get("mimeType") if isinstance(asset, dict) else None,
        "width": asset.get("width") if isinstance(asset, dict) else None,
        "height": asset.get("height") if isinstance(asset, dict) else None,
        "uploadCount": asset.get("uploadCount") if isinstance(asset, dict) else None,
    }


def summarize_card(kind: str, card: dict[str, Any]) -> dict[str, Any]:
    """生成单张卡片的结构摘要，覆盖 C0 人工核对字段。"""
    task = card.get("task") if isinstance(card.get("task"), dict) else {}
    material = card.get("material") if isinstance(card.get("material"), dict) else {}
    return {
        "kind": kind,
        "id": card.get("id"),
        "hasMaterial": bool(material),
        "materialKeys": sorted(material.keys()) if isinstance(material, dict) else [],
        "asset": summarize_asset(card),
        "hasTask": bool(task),
        "taskKeys": sorted(task.keys()) if isinstance(task, dict) else [],
        "correctOptionKey": task.get("correctOptionKey") if isinstance(task, dict) else None,
        "correctOptionKeyComplete": bool(task.get("correctOptionKey")) if isinstance(task, dict) else False,
        "optionCount": len(task.get("options") or []) if isinstance(task, dict) and isinstance(task.get("options"), list) else 0,
        "hasExplanation": "explanation" in card,
        "explanationKeys": sorted(card.get("explanation", {}).keys()) if isinstance(card.get("explanation"), dict) else [],
        "hasSource": "source" in card,
        "sourceKeys": sorted(card.get("source", {}).keys()) if isinstance(card.get("source"), dict) else [],
        "hasVerification": "verification" in card,
        "verificationKeys": sorted(card.get("verification", {}).keys()) if isinstance(card.get("verification"), dict) else [],
        "hasRevision": "revision" in card,
        "revisionKeys": sorted(card.get("revision", {}).keys()) if isinstance(card.get("revision"), dict) else [],
        "hasReadiness": "readiness" in card,
        "readinessKeys": sorted(card.get("readiness", {}).keys()) if isinstance(card.get("readiness"), dict) else [],
        "hasPeerReviewSummary": "peerReviewSummary" in card,
        "peerReviewSummaryKeys": sorted(card.get("peerReviewSummary", {}).keys())
        if isinstance(card.get("peerReviewSummary"), dict)
        else [],
        "sourceStableForSeed": isinstance(card.get("source"), dict) and bool(card.get("source")),
        "verificationStableForSeed": isinstance(card.get("verification"), dict) and bool(card.get("verification")),
    }


def summarize_package(pkg: dict[str, Any], source_path: str | None) -> dict[str, Any]:
    """汇总 ready 包的学生与卡片字段。"""
    student = pkg.get("student") if isinstance(pkg.get("student"), dict) else {}
    cards = pkg.get("cards") if isinstance(pkg.get("cards"), dict) else {}
    class_id_suggestion = coerce_class_id(
        clazz=student.get("clazz"),
        class_seat_code=student.get("classSeatCode"),
    )
    card_summaries = {
        kind: summarize_card(kind, cards.get(kind))
        for kind in CARD_KINDS
        if isinstance(cards.get(kind), dict)
    }
    return {
        "sourcePath": source_path,
        "packageVersion": pkg.get("packageVersion"),
        "studentName": student.get("studentName"),
        "clazz": student.get("clazz"),
        "classSeatCode": student.get("classSeatCode"),
        "classIdSuggestion": class_id_suggestion,
        "cards": card_summaries,
        "allCorrectOptionKeysComplete": all(card.get("correctOptionKeyComplete") for card in card_summaries.values())
        and len(card_summaries) == 2,
        "allAssetsAreDataUrl": all(card.get("asset", {}).get("hasDataUrl") for card in card_summaries.values())
        and bool(card_summaries),
    }


def get_outer_student(obj: Any) -> dict[str, Any]:
    """从 portfolio 外层补充学生信息，供 v2 fallback 使用。"""
    if not isinstance(obj, dict):
        return {}
    for path in (["student"], ["portfolio", "student"], ["profile"], ["portfolio", "profile"]):
        value = get_path(obj, path)
        if isinstance(value, dict):
            return value
    return {}


def build_normalized_submission(
    *,
    source_file: Path,
    source_path: str | None,
    package_version: str,
    student: dict[str, Any],
    cards: dict[str, Any],
) -> dict[str, Any]:
    """把 ready 包或 v2 fallback 转成 seed 脚本使用的统一结构。"""
    clazz = student.get("clazz") or student.get("className")
    class_seat_code = student.get("classSeatCode") or student.get("seatCode")
    normalized_cards = []
    for kind in CARD_KINDS:
        card = cards.get(kind)
        if not isinstance(card, dict):
            continue
        task = card.get("task") if isinstance(card.get("task"), dict) else {}
        normalized_cards.append(
            {
                "kind": kind,
                "cardId": card.get("id"),
                "correctOptionKey": task.get("correctOptionKey") if isinstance(task, dict) else None,
                "card": card,
            }
        )
    return {
        "sourceFile": str(source_file),
        "sourcePath": source_path,
        "packageVersion": package_version,
        "studentName": student.get("studentName") or student.get("name"),
        "clazz": clazz,
        "classSeatCode": class_seat_code,
        "classIdSuggestion": coerce_class_id(clazz=clazz, class_seat_code=class_seat_code),
        "cards": normalized_cards,
    }


def inspect_portfolio_file(path: Path) -> tuple[dict[str, Any], dict[str, Any] | None]:
    """检视单个学生 portfolio JSON，并返回报告记录与可选归一化提交。"""
    obj = load_json(path)
    ready_pkg, ready_path = find_ready_package(obj)
    v2_cards, v2_path = find_v2_cards(obj)
    record: dict[str, Any] = {
        "sourceType": "portfolio",
        "file": str(path),
        "foundReadyPackage": isinstance(ready_pkg, dict),
        "readyPackagePath": ready_path,
        "foundV2Cards": bool(v2_cards),
        "v2Path": v2_path,
        "summary": summarize_package(ready_pkg, ready_path) if isinstance(ready_pkg, dict) else None,
    }
    if isinstance(ready_pkg, dict):
        student = ready_pkg.get("student") if isinstance(ready_pkg.get("student"), dict) else {}
        cards = ready_pkg.get("cards") if isinstance(ready_pkg.get("cards"), dict) else {}
        normalized = build_normalized_submission(
            source_file=path,
            source_path=ready_path,
            package_version=ready_pkg.get("packageVersion") or READY_PACKAGE_VERSION,
            student=student,
            cards=cards,
        )
    elif v2_cards:
        student = get_outer_student(obj)
        normalized = build_normalized_submission(
            source_file=path,
            source_path=v2_path,
            package_version="lesson4-v2-fallback",
            student=student,
            cards=v2_cards,
        )
    else:
        normalized = None
    if v2_cards:
        record["v2Cards"] = {kind: summarize_card(kind, card) for kind, card in v2_cards.items()}
    return record, normalized


def inspect_cloud_file(path: Path) -> dict[str, Any]:
    """检视 SQLite 导出的 cloud fixture JSON，标记其仅为互审快照。"""
    obj = load_json(path)
    records = obj.get("records") if isinstance(obj, dict) and isinstance(obj.get("records"), list) else []
    class_id = obj.get("classId") if isinstance(obj, dict) else None
    card_summaries: list[dict[str, Any]] = []
    for entry in records[:20]:
        cards = entry.get("cards") if isinstance(entry, dict) and isinstance(entry.get("cards"), dict) else {}
        for kind in CARD_KINDS:
            card = cards.get(kind)
            if isinstance(card, dict):
                card_summaries.append(summarize_card(kind, card))
    return {
        "sourceType": "cloud",
        "file": str(path),
        "classId": class_id,
        "classIdSuggestion": coerce_class_id(cloud_class_id=class_id),
        "isAuthoritativeV2": False,
        "sourceNote": "课时 4 互审快照，仅作对照源；权威 V2 以学生 portfolio ready 包为准。",
        "recordCount": len(records),
        "sampleCardSummaries": card_summaries,
    }


def build_markdown_report(report: dict[str, Any], normalized: dict[str, Any]) -> str:
    """生成便于 C0 人工核对的 Markdown 报告。"""
    lines = [
        "# Module4 Lesson5 Fixture Source Shape Report",
        "",
        "## 核对结论",
        "",
        f"- portfolio 文件数：{report['summary']['portfolioFileCount']}",
        f"- cloud fixture 文件数：{report['summary']['cloudFileCount']}",
        f"- 归一化提交数：{len(normalized['submissions'])}",
        "- class_id 建议：`初一（3）班` / `0310` / `云端 class-03` 均归一为 `g7c03`。",
        "- `content_hash` 当前按完整 `card_json` 稳定 JSON 计算；dataUrl 会参与 hash，C0 需要人工确认是否保留该口径。",
        "",
        "## Portfolio",
        "",
    ]
    for record in report["records"]:
        if record.get("sourceType") != "portfolio":
            continue
        summary = record.get("summary") or {}
        lines.extend(
            [
                f"### `{Path(record['file']).name}`",
                "",
                f"- ready 包：{record.get('foundReadyPackage')}（路径：`{record.get('readyPackagePath')}`）",
                f"- v2 卡片：{record.get('foundV2Cards')}（路径：`{record.get('v2Path')}`）",
                f"- studentName：{summary.get('studentName')}",
                f"- clazz / classSeatCode：{summary.get('clazz')} / {summary.get('classSeatCode')}",
                f"- packageVersion：{summary.get('packageVersion')}",
                f"- class_id 建议：{summary.get('classIdSuggestion')}",
                f"- correctOptionKey 齐全：{summary.get('allCorrectOptionKeysComplete')}",
                f"- asset 均为 dataUrl：{summary.get('allAssetsAreDataUrl')}",
            ]
        )
        for kind, card in (summary.get("cards") or {}).items():
            lines.extend(
                [
                    f"- cards.{kind}.id：{card.get('id')}",
                    f"  - kind/material/task/explanation/source/revision/readiness/peerReviewSummary："
                    f"{card.get('kind')} / {card.get('hasMaterial')} / {card.get('hasTask')} / "
                    f"{card.get('hasExplanation')} / {card.get('hasSource')} / {card.get('hasRevision')} / "
                    f"{card.get('hasReadiness')} / {card.get('hasPeerReviewSummary')}",
                    f"  - correctOptionKey：{card.get('correctOptionKey')}；asset：{card.get('asset')}",
                    f"  - source/verification 稳定性：{card.get('sourceStableForSeed')} / {card.get('verificationStableForSeed')}",
                ]
            )
        lines.append("")
    lines.extend(["## Cloud Snapshot", ""])
    for record in report["records"]:
        if record.get("sourceType") != "cloud":
            continue
        lines.extend(
            [
                f"### `{Path(record['file']).name}`",
                "",
                f"- classId：{record.get('classId')} -> {record.get('classIdSuggestion')}",
                f"- recordCount：{record.get('recordCount')}",
                f"- 权威 V2：{record.get('isAuthoritativeV2')}（{record.get('sourceNote')}）",
                "",
            ]
        )
    return "\n".join(lines)


def main() -> None:
    """命令行入口：生成 JSON/Markdown 报告与归一化 seed 输入。"""
    parser = argparse.ArgumentParser(description="检视模块 4 课时 5 fixture 来源形状")
    parser.add_argument("--cloud-dir", default=str(DEFAULT_ROOT / "cloud_lesson4_question_bank"))
    parser.add_argument("--portfolio-dir", default=str(DEFAULT_ROOT / "student_portfolio_json"))
    parser.add_argument("--portfolio-files", nargs="*", default=[])
    parser.add_argument("--out-dir", default=str(DEFAULT_ROOT / "generated"))
    args = parser.parse_args()

    out_dir = Path(args.out_dir).expanduser()
    out_dir.mkdir(parents=True, exist_ok=True)

    records: list[dict[str, Any]] = []
    submissions: list[dict[str, Any]] = []
    portfolio_files = [Path(value).expanduser() for value in args.portfolio_files]
    portfolio_files.extend(iter_json_files(Path(args.portfolio_dir).expanduser()))
    seen_portfolio_files = sorted({path.resolve() for path in portfolio_files})

    for path in seen_portfolio_files:
        try:
            record, normalized = inspect_portfolio_file(path)
            records.append(record)
            if normalized is not None:
                submissions.append(normalized)
        except Exception as exc:  # noqa: BLE001
            records.append({"sourceType": "portfolio", "file": str(path), "error": f"{type(exc).__name__}: {exc}"})

    cloud_files = iter_json_files(Path(args.cloud_dir).expanduser())
    for path in cloud_files:
        try:
            records.append(inspect_cloud_file(path))
        except Exception as exc:  # noqa: BLE001
            records.append({"sourceType": "cloud", "file": str(path), "error": f"{type(exc).__name__}: {exc}"})

    report = {
        "summary": {
            "portfolioFileCount": len(seen_portfolio_files),
            "cloudFileCount": len(cloud_files),
            "recordCount": len(records),
            "classIdCoercion": {
                "初一（3）班": "g7c03",
                "0310": "g7c03",
                "class-03": "g7c03",
            },
            "hashNote": "seed 阶段按完整 card_json 稳定 JSON 计算 content_hash；dataUrl 暂保留并参与 hash，C0 需人工核对口径。",
        },
        "records": records,
    }
    normalized = {
        "generatedBy": Path(__file__).name,
        "sourcePackageVersion": READY_PACKAGE_VERSION,
        "notes": [
            "只把学生 portfolio ready 包作为权威 V2 来源。",
            "cloud fixture 是课时 4 互审快照，仅用于对照字段形状。",
            "完整 card_json 保留 dataUrl；C0 需要人工核对 hash 口径。",
        ],
        "submissions": submissions,
    }

    write_json(out_dir / "source_shape_report.json", report)
    write_json(out_dir / "lesson5_v2_submissions.normalized.json", normalized)
    (out_dir / "source_shape_report.md").write_text(build_markdown_report(report, normalized), encoding="utf-8")
    print(f"已生成报告：{out_dir / 'source_shape_report.json'}")
    print(f"已生成归一化提交：{out_dir / 'lesson5_v2_submissions.normalized.json'}")


if __name__ == "__main__":
    main()

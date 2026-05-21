"""
文件说明：模块 4 课时 3 AI review 数据结构。
职责：定义题卡自检助手请求、响应和结构化建议 schema，保证后端输入输出可校验。
更新触发：课时 3 自检字段、响应状态、来源类型或前端 adapter 契约变化时，需要同步更新本文件。
"""

from typing import Optional

from pydantic import BaseModel, Field, validator


SourceType = str
MaterialKind = str
ReviewStatus = str
ReviewArea = str
ReviewLevel = str


class Lesson3AiReviewMaterial(BaseModel):
    """题卡素材信息，只接收自检必要字段。"""

    titleOrName: str = ""
    displayNote: str = ""
    assetDataUrl: Optional[str] = None
    assetMimeType: Optional[str] = None
    assetFingerprint: Optional[str] = None

    @validator("assetDataUrl")
    @classmethod
    def validate_asset_data_url(cls, value: Optional[str]) -> Optional[str]:
        """校验图片 DataURL 前缀，避免接收非图片内容。"""
        if value is None or value == "":
            return value
        if not value.startswith("data:image/"):
            raise ValueError("assetDataUrl 必须是图片 DataURL")
        return value


class Lesson3AiReviewOption(BaseModel):
    """题卡判断选项。"""

    key: str
    label: str


class Lesson3AiReviewTask(BaseModel):
    """题卡判断任务。"""

    prompt: str = ""
    options: list[Lesson3AiReviewOption] = Field(default_factory=list)
    correctOptionKey: Optional[str] = None

    @validator("options")
    @classmethod
    def validate_options_count(cls, value: list[Lesson3AiReviewOption]) -> list[Lesson3AiReviewOption]:
        """限制选项数量，当前课时默认三项，最多允许四项。"""
        if len(value) > 4:
            raise ValueError("选项最多 4 个")
        return value


class Lesson3AiReviewExplanation(BaseModel):
    """题卡核心解析。"""

    text: str = ""


class Lesson3AiReviewSource(BaseModel):
    """题卡来源与核验入口。"""

    sourceType: Optional[SourceType] = None
    sourceRecord: str = ""
    verificationNote: str = ""

    @validator("sourceType")
    @classmethod
    def validate_source_type(cls, value: Optional[str]) -> Optional[str]:
        """限制来源类型为课时 3 固定四类。"""
        if value is None:
            return value
        if value not in {"web", "ai_generated", "field_capture", "mixed"}:
            raise ValueError("sourceType 不在允许范围内")
        return value


class Lesson3AiReviewClientContext(BaseModel):
    """前端上下文，不包含学生身份信息。"""

    lessonId: int
    version: str
    requestNo: int = 1

    @validator("lessonId")
    @classmethod
    def validate_lesson_id(cls, value: int) -> int:
        """只接收课时 3 请求。"""
        if value != 3:
            raise ValueError("lessonId 必须为 3")
        return value

    @validator("version")
    @classmethod
    def validate_version(cls, value: str) -> str:
        """只接收 V1 题卡自检。"""
        if value != "v1":
            raise ValueError("version 必须为 v1")
        return value


class Lesson3AiReviewRequest(BaseModel):
    """课时 3 题卡自检请求。"""

    cardId: str
    kind: MaterialKind
    material: Lesson3AiReviewMaterial
    task: Lesson3AiReviewTask
    explanation: Lesson3AiReviewExplanation
    source: Lesson3AiReviewSource
    clientContext: Lesson3AiReviewClientContext

    @validator("kind")
    @classmethod
    def validate_kind(cls, value: str) -> str:
        """限制素材类型为新闻或图片。"""
        if value not in {"news", "image"}:
            raise ValueError("kind 必须为 news 或 image")
        return value


class Lesson3AiReviewCheck(BaseModel):
    """单条题卡质量建议。"""

    area: ReviewArea
    level: ReviewLevel
    message: str
    suggestion: Optional[str] = None


class Lesson3AiReviewResult(BaseModel):
    """题卡自检结构化结果。"""

    status: ReviewStatus
    summary: str
    checks: list[Lesson3AiReviewCheck] = Field(default_factory=list)
    missingRequiredFields: list[str] = Field(default_factory=list)
    suggestedEdits: list[str] = Field(default_factory=list)
    safetyFlags: list[str] = Field(default_factory=list)


class Lesson3AiReviewResponse(BaseModel):
    """课时 3 题卡自检响应。"""

    requestId: str
    provider: str
    reviewedAt: str
    result: Lesson3AiReviewResult

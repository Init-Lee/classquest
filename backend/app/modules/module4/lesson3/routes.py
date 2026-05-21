"""
文件说明：模块 4 课时 3 AI review 路由。
职责：提供题卡自检助手 endpoint，执行基础大小限制并委托 mock/Qwen provider 返回结构化建议。
更新触发：课时 3 endpoint、请求限制、provider 调用或错误策略变化时，需要同步更新本文件。
"""

import os

from fastapi import APIRouter, HTTPException, status

from .qwen_client import get_lesson3_ai_review_provider
from .schemas import Lesson3AiReviewRequest, Lesson3AiReviewResponse

router = APIRouter(prefix="/lesson3", tags=["module4-lesson3"])


@router.post("/ai-review", response_model=Lesson3AiReviewResponse)
async def review_lesson3_question_card(payload: Lesson3AiReviewRequest) -> Lesson3AiReviewResponse:
    """返回课时 3 题卡质量自检建议，不阻断前端保存 V1。"""
    max_image_bytes = int(os.getenv("LESSON3_AI_REVIEW_MAX_IMAGE_BYTES", "700000"))
    if payload.material.assetDataUrl and len(payload.material.assetDataUrl.encode("utf-8")) > max_image_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="图片 DataURL 超出自检大小限制")
    provider = get_lesson3_ai_review_provider()
    return await provider.review(payload)

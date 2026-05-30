"""
文件说明：模块 4 DashScope/Qwen OpenAI-compatible Chat Completions 共享客户端。
职责：统一读取 DASHSCOPE_API_KEY、QWEN_BASE_URL、QWEN_TEXT_MODEL 等环境变量，供 lesson3 自检与 lesson4 互审审核复用。
更新触发：Qwen endpoint、鉴权方式、超时/重试策略或共享 env 变量名变化时，需要同步更新本文件。
"""

from __future__ import annotations

import os
from typing import Any

import httpx


class QwenHttpError(RuntimeError):
    """Qwen HTTP 可定位错误，不包含密钥或完整模型响应。"""


def read_dashscope_api_key() -> str:
    """读取并基础校验 DashScope API key，避免非法字符进入 Authorization header。"""
    api_key = os.getenv("DASHSCOPE_API_KEY", "").strip().strip("'\"“”")
    if not api_key:
        return ""
    if any(ord(char) > 127 for char in api_key):
        raise QwenHttpError(
            "DASHSCOPE_API_KEY 含有非 ASCII 字符，请检查是否仍是中文占位或使用了中文引号。"
        )
    return api_key


def get_qwen_base_url() -> str:
    return os.getenv("QWEN_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1").rstrip("/")


def get_qwen_text_model() -> str:
    return os.getenv("QWEN_TEXT_MODEL", "qwen3.5-flash")


async def qwen_chat_json(
    *,
    system_prompt: str,
    user_prompt: str,
    max_tokens: int,
    timeout_seconds: float,
    temperature: float = 0.1,
) -> str:
    """调用 Qwen Chat Completions 并返回 message.content 字符串（期望为 JSON）。"""
    api_key = read_dashscope_api_key()
    if not api_key:
        raise QwenHttpError("AI 审核暂不可用：未配置 DASHSCOPE_API_KEY。")

    body: dict[str, Any] = {
        "model": get_qwen_text_model(),
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "response_format": {"type": "json_object"},
        "temperature": temperature,
        "max_tokens": max_tokens,
        "enable_thinking": False,
    }
    async with httpx.AsyncClient(timeout=timeout_seconds) as client:
        response = await client.post(
            f"{get_qwen_base_url()}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json=body,
        )
        response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]

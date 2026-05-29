<!--
文件说明：模块 4 课时 3 后端说明。
职责：说明题卡自检助手后端壳的 endpoint、provider 策略和安全边界。
更新触发：lesson3 endpoint、环境变量、provider 行为或前后端契约变化时，需要同步更新本文件。
-->

# Module 4 Lesson 3 Backend

本目录是模块四课时 3「题目卡 V1 制作与解析填写」的后端壳，提供题卡自检助手 endpoint（mock / Qwen）。

## Endpoint

FastAPI 在 `backend/app/main.py` 统一挂载 `/api/v1/module4`，本目录 router 使用 `/lesson3` 前缀，因此前端 adapter 调用：

```text
POST /api/v1/module4/lesson3/ai-review
```

## Provider

- 默认 `LESSON3_AI_REVIEW_PROVIDER=mock`，不需要 `DASHSCOPE_API_KEY`。
- `LESSON3_AI_REVIEW_PROVIDER=qwen` 会通过 Qwen OpenAI-compatible Chat Completions 调用真实模型；没有 API key 时回落 mock。
- 推荐联调模型先用 `QWEN_TEXT_MODEL=qwen3.5-flash`；图片题卡默认只发送脱敏后的文本字段，不发送完整 DataURL。
- 如后续确认模型支持视觉输入，可设置 `QWEN_ENABLE_IMAGE_INPUT=true` 并配置 `QWEN_VISION_MODEL`，后端才会把图片 DataURL 放入 Qwen vision payload。
- 发给 Qwen 的题卡内容使用中文标签整理，不直接暴露 `sourceType`、`correctOptionKey` 等内部 JSON 字段名；返回建议也会兜底清洗内部枚举值。
- Qwen 返回后会经过本地 V1 最低可运行标准后处理：只有素材、任务、解析、来源入口的硬性缺失才会 `blocked`；模型对表达、事实依据或来源规范的严格意见最多降级为 `warning`。
- 后端不记录完整图片 DataURL，不接收学生姓名、班级、学号或完整 portfolio。

## 轻量服务器联调参数

后端启动时会自动读取 `backend/.env`，本地只需要把 `DASHSCOPE_API_KEY` 填进去，不必每次手动 `export`。示例配置见 `backend/.env.example`：

```bash
LESSON3_AI_REVIEW_PROVIDER=qwen
DASHSCOPE_API_KEY 只放在 backend/.env 或服务器环境变量中
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_TEXT_MODEL=qwen3.5-flash
QWEN_ENABLE_IMAGE_INPUT=false
QWEN_MAX_TOKENS=600
LESSON3_AI_REVIEW_TIMEOUT_SECONDS=45
LESSON3_AI_REVIEW_MAX_IMAGE_BYTES=700000
```

本地前端已可通过根目录 `.env.local` 设置：

```bash
VITE_MODULE4_LESSON3_AI_REVIEW_MODE=http
VITE_API_PROXY_TARGET=http://127.0.0.1:8000
```

如果 FastAPI 跑在轻量服务器上，OSS 方案 B 需在前端 build 时设置 `VITE_API_BASE_URL`，并在后端 `.env` 配置 `CORS_ALLOWED_ORIGINS` 允许 OSS 域名；正式部署建议用 Nginx 暴露 80/443，不把 `DASHSCOPE_API_KEY` 下发给浏览器。

本地验证建议使用 `backend/.venv` 启动，避免系统 Python 或 conda 依赖污染 Qwen 联调结果。

## 边界

自检助手只检查题卡是否具备 V1 最低可运行结构，不裁定新闻真伪，不裁定图片是否一定由 AI 生成；只有硬性必填缺失才阻断保存，`needs_revision` 允许保存 V1 并提示课时 4 继续优化。

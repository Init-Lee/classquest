<!--
文件说明：模块 4 课时 3 后端说明。
职责：说明题卡自检助手后端壳的 endpoint、provider 策略和安全边界。
更新触发：lesson3 endpoint、环境变量、provider 行为或前后端契约变化时，需要同步更新本文件。
-->

# Module 4 Lesson 3 Backend

本目录是模块四课时 3「题目卡 V1 制作与解析填写」的后端壳，当前 dev 分支只提供题卡自检助手 endpoint。

## Endpoint

FastAPI 在 `backend/app/main.py` 统一挂载 `/api/v1/module4`，本目录 router 使用 `/lesson3` 前缀，因此前端 adapter 调用：

```text
POST /api/v1/module4/lesson3/ai-review
```

## Provider

- 默认 `LESSON3_AI_REVIEW_PROVIDER=mock`，不需要 `DASHSCOPE_API_KEY`。
- `LESSON3_AI_REVIEW_PROVIDER=qwen` 只保留可切换 provider stub；没有 API key 时回落 mock，本阶段不做真实联调。
- 后端不记录完整图片 DataURL，不接收学生姓名、班级、学号或完整 portfolio。

## 边界

自检助手只检查题卡结构、表达、解析具体度和来源可追溯性，不裁定新闻真伪，不裁定图片是否一定由 AI 生成，也不作为保存 V1 的阻断条件。

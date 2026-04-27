<!--
文件说明：模块 4 API 草案。
职责：为模块 4 前端 mock adapter 和后续 FastAPI 实现提供接口方向，不冻结最终合同。
更新触发：模块 4 提交、审核、试答、评分或画廊流程字段变化时，需要同步更新本文件。
-->

# 模块 4 API 草案

本文件是草案，不是最终合同。前端应先使用 mock adapter，流程稳定后再切换 HTTP adapter。

## 学生/公开 API

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/api/v1/modules` | 获取模块列表 |
| GET | `/api/v1/module4/config` | 获取模块 4 运行配置 |
| POST | `/api/v1/module4/files` | 上传图片或来源证明 |
| POST | `/api/v1/module4/submission-packs` | 首次提交题卡包 |
| PUT | `/api/v1/module4/submission-packs/{pack_id}` | 更新提交包 |
| GET | `/api/v1/module4/submission-packs/{pack_id}/status` | 查询审核状态 |
| GET | `/api/v1/module4/quiz/current` | 获取当前开放试答轮次 |
| GET | `/api/v1/module4/quiz/{round_id}/set` | 获取随机题组 |
| POST | `/api/v1/module4/quiz/{round_id}/attempts` | 提交答案 |
| POST | `/api/v1/module4/quiz/{round_id}/ratings` | 提交快速评分 |
| GET | `/api/v1/module4/gallery` | 读取发布画廊 |

## 教师 API

| 方法 | 路径 | 用途 |
|---|---|---|
| POST | `/api/v1/auth/teacher/login` | 教师登录 |
| POST | `/api/v1/auth/teacher/logout` | 教师退出 |
| GET | `/api/v1/teacher/me` | 当前教师 |
| GET | `/api/v1/teacher/module4/submission-packs` | 提交列表 |
| POST | `/api/v1/teacher/module4/reviews` | 审核题卡 |
| POST | `/api/v1/teacher/module4/rounds` | 创建试答轮次 |
| PATCH | `/api/v1/teacher/module4/rounds/{round_id}` | 开启/关闭试答 |
| POST | `/api/v1/teacher/module4/stats/recompute` | 重算统计 |
| POST | `/api/v1/teacher/module4/publish-bundles` | 导出画廊/题库 |

## Mock adapter 要求

模块 4 前端开发初期使用 `src/modules/module-4-ai-info-detective/api/module4-api.mock.ts`。

真实后端稳定后切换到 `src/modules/module-4-ai-info-detective/api/module4-api.http.ts`。


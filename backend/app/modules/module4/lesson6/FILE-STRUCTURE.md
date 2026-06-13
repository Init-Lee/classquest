<!--
文件说明：backend/app/modules/module4/lesson6/ 目录结构真相源。
职责：记录 Lesson6 后端包当前文件职责、后续扩展位置与依赖方向。
更新触发：课时 6 新增/移动 service、repository、schema、routes 或调整依赖方向时，需要同步更新本文件。
-->

# FILE-STRUCTURE — backend/app/modules/module4/lesson6

```text
backend/app/modules/module4/lesson6/
├── README.md
├── FILE-STRUCTURE.md
├── __init__.py
├── schemas.py
├── routes_teacher.py
├── routes_student.py
├── repository.py
├── publication_service.py
├── challenge_service.py
├── stats_service.py
└── routes_public.py
```

## C0-C1b 职责

- `schemas.py`：定义 Lesson6 发布审核、公共题库 overview/item-stats、学生本人状态查询与公共挑战的 Pydantic 请求/响应模型，字段使用 camelCase。
- `routes_teacher.py`：注册教师侧 `/lesson6/v3-publication-reviews*` 与 `/lesson6/public-bank/overview`、`/lesson6/public-bank/item-stats` 端点；读取允许 teacher/demo，发布仅允许 teacher manage。
- `routes_student.py`：注册学生侧 `/lesson6/my-v3-publication-status` 端点；只按请求中的 item/version 键返回状态。
- `routes_public.py`：注册无鉴权 `/public-challenge/runs*` 端点；从请求头/IP/UA 读取匿名 runtime 线索，原始值只传给服务层哈希化。
- `repository.py`：封装 V3 发布审核记录、公共题库 view、公共挑战 runs/run_items/answers 与 stats 缓存的 SQL。
- `publication_service.py`：提供 `ensure_publication_review_for_v3()`，在 Lesson5 V3 提交后创建 `pending_teacher_check` 记录；同时装配教师 list/detail/publish、public-bank overview 与学生状态查询业务。
- `challenge_service.py`：实现公共挑战 3+3 低曝光抽样、run 创建、current 隐私剥离、answer 幂等判分、summary 与 runtime 哈希。
- `stats_service.py`：实现公共题卡 stats 增量入口和教师 overview topStats 装配。
- `__init__.py`：声明 lesson6 后端服务包边界，不包含初始化副作用。

## Dependency Direction

```text
routes_teacher/routes_student -> publication_service -> repository -> database
routes_public -> challenge_service -> stats_service / repository -> database
schemas -> routes/services
services 不依赖 routes
lesson5/revision_service -> lesson6/publication_service -> lesson6/repository
```

C0 允许 Lesson5 在 V3 提交成功后调用 Lesson6 发布审核 service；Lesson6 不反向导入 Lesson5 service 或 routes。

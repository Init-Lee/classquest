<!--
文件说明：模块 4 课时 6 后端服务目录说明。
职责：记录 Lesson6 后端包的产品边界、C0-C1b 已落地能力、当前端点清单与验证方式。
更新触发：课时 6 新增 route、service、repository、schema、发布审核流程或公共挑战契约变化时，需要同步更新本文件。
-->

# Module 4 Lesson 6 Backend

本目录实现模块 4 课时 6运行时，核心边界是：

```text
V3 教师发布确认
全局公共题库
匿名 6 题公共挑战
公共挑战统计
学生本人 V3 发布状态查询
```

Lesson6 不创建班级专属匿名题池。公共挑战只从已由教师确认 `publishable` 且 `is_active_public=1` 的全局 V3 题卡中抽题。

## C0-C1b 已落地能力

- Lesson5 学生提交 V3 后，服务端为该 `item_version_id` 幂等创建 `pending_teacher_check` 发布审核记录。
- `pending_teacher_check` 记录默认 `is_active_public=0`，不会进入 `module4_public_question_bank` view。
- 教师端已注册 V3 发布审核列表、详情、发布确认与公共题库 overview API；teacher 只看授权班级，demo 可只读查看，publish 仅允许具备目标班级 `manage` 权限的 teacher。
- 教师端公共题库逐题统计 `item-stats` 复用已有公共挑战统计缓存；返回全量 active public 题卡，未作答题卡按 0 兜底，不返回作者或答题者身份。
- 学生端已注册本人 V3 发布状态查询 API，仅按本地档案提交的 `itemId + itemVersionId` 键返回状态，不提供班级或座位枚举入口。
- 公共端已注册匿名挑战 run 创建、current、answer 与 summary API；抽样从全局 active public V3 题库读取，优先 3 news + 3 image、低曝光优先，不足同 kind 时跨 kind 补齐，总数不足 6 返回 `public_bank_not_ready`。
- 公共挑战 answer 幂等判分，未作答 current 不返回标准答案、解析、来源或作者身份；作答后 reveal 返回标准答案、解析与来源，但仍不返回作者身份。
- 公共挑战 stats 按 `lesson6_class` 与 `public_showcase` 隔离增量写入，教师 overview 返回 challengeStats 与 topStats。

## 当前端点清单

Teacher:

```text
GET  /api/v1/teacher/module4/lesson6/v3-publication-reviews
GET  /api/v1/teacher/module4/lesson6/v3-publication-reviews/{review_id}
POST /api/v1/teacher/module4/lesson6/v3-publication-reviews/{review_id}/publish
GET  /api/v1/teacher/module4/lesson6/public-bank/overview
GET  /api/v1/teacher/module4/lesson6/public-bank/item-stats
```

Student:

```text
POST /api/v1/module4/lesson6/my-v3-publication-status
```

Public:

```text
POST /api/v1/module4/public-challenge/runs
GET  /api/v1/module4/public-challenge/runs/{run_id}/current
POST /api/v1/module4/public-challenge/runs/{run_id}/answers
GET  /api/v1/module4/public-challenge/runs/{run_id}/summary
```

当前 C1b 已实现 Teacher、Student 与 Public challenge 端点；接口级人工验证已覆盖教师审核发布、学生状态查询、公共挑战建 run/current/answer/summary 与教师 overview 统计。前端页面留到 C2/C3/C4。

## Contexts

```text
lesson6_class
public_showcase
```

同一个全局题库，统计按 context 隔离。

## Privacy

公共挑战不得返回作者姓名、作者座位码或班级身份。正确答案、解析和来源只允许在答题者提交答案后揭示。

## Verification

后端回归建议在 `classquest/backend` 下执行：

```bash
.venv/bin/python -m compileall app
.venv/bin/python -m unittest tests.test_module4_lesson6_publication tests.test_module4_lesson6_public_challenge tests.test_module4_lesson6_stats tests.test_module4_lesson5_v3_revision
.venv/bin/python -m unittest discover -s tests -p 'test_module4*.py'
```

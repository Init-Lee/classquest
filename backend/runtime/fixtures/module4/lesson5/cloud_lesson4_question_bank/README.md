<!--
文件说明：模块 4 课时 5 云端课时 4 互审快照 fixture 目录占位。
职责：本地调试时临时存放从 SQLite 备份导出的课时 4 `class-03` 互审快照 JSON，仅作为对照源，不是权威 V2 题卡来源。
更新触发：fixture 导出流程、云端对照源范围或隐私边界变化时，需要同步更新本文件。
-->

# cloud_lesson4_question_bank

此目录只保留说明文件入库。真实导出的云端互审快照 JSON 含学生题卡内容，必须保持在 `.gitignore` 忽略范围内，不得提交。

使用 `backend/scripts/export_module4_lesson5_cloud_fixture_from_lesson4_db.py` 可从本地 SQLite 备份导出临时调试数据。

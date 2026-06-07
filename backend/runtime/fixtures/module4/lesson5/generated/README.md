<!--
文件说明：模块 4 课时 5 fixture 检视与归一化输出目录占位。
职责：本地调试时存放 inspect 生成的形状报告、归一化 V2 提交包和 seed 中间结果。
更新触发：inspect/seed 输出格式、hash 核对口径或 C0 联调流程变化时，需要同步更新本文件。
-->

# generated

此目录只保留说明文件入库。`source_shape_report.*`、`lesson5_v2_submissions.normalized.json` 等生成物可能包含真实学生题卡内容，必须保持在 `.gitignore` 忽略范围内，不得提交。

C0 阶段生成报告后，需要人工核对 `class_id` 映射、dataUrl 体积和 `content_hash` 口径。

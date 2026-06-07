<!--
文件说明：模块 4 课时 5 学生本地档案 JSON fixture 目录占位。
职责：本地调试时临时存放学生继续学习包 JSON，用于 inspect/seed 验证 lesson4 ready 包和 V2 卡片形状。
更新触发：学生档案导入方式、字段识别规则或真实数据隐私边界变化时，需要同步更新本文件。
-->

# student_portfolio_json

此目录只保留说明文件入库。真实学生 JSON 包含姓名、班级、题卡和图片 dataUrl，必须保持在 `.gitignore` 忽略范围内，不得提交。

优先使用 inspect 脚本的 `--portfolio-files` 直接读取外部路径，避免复制真实数据到仓库目录。

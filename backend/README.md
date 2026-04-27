<!--
文件说明：ClassQuest V1.5 后端说明。
职责：说明 backend/ 的定位、技术栈、运行时数据目录和实现顺序。
更新触发：后端职责、技术栈、运行时目录或模块 4 接入策略变化时，需要同步更新本文件。
-->

# Backend — ClassQuest V1.5

后端提供 ClassQuest V1.5 的轻量运行时支持，主要服务模块 4。

## 职责

- 学生题卡提交
- 教师审核
- 试答轮次控制
- 匿名答题记录
- 快速评分记录
- 统计重算
- 画廊/题库导出

后端不替代 Moodle，也不管理完整学生学习进度。

## 技术栈

```text
FastAPI
SQLite
本地文件存储
Nginx 反向代理
HTTPS
```

## 运行时数据

使用服务器本地持久目录：

```text
/var/lib/classquest/
├── db/
├── uploads/
├── exports/
└── backups/
```

不要把运行时文件写入仓库源码目录。

## 当前状态

本轮仅落骨架：`GET /api/v1/health` 健康检查 + 模块 4 空 router。真实提交、审核、试答和统计逻辑在模块 4 mock 流程稳定后再实现。


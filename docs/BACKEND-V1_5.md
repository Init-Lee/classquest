<!--
文件说明：ClassQuest V1.5 后端架构说明。
职责：描述 FastAPI 后端的职责、目录、运行时数据路径和实现顺序。
更新触发：后端技术栈、运行时路径、认证策略或模块 4 后端职责变化时，需要同步更新本文件。
-->

# Backend V1.5

后端不是通用 LMS，而是模块 4 的轻量运行时层。

## 负责

题卡提交、教师审核、试答轮次控制、匿名答题记录、快速评分记录、统计重算、画廊/题库导出。

## 不负责

完整学生账号、Moodle 替代、实时协作、WebSocket、云端完整学习进度同步。

## 技术栈

```text
Python + FastAPI
SQLite
Nginx 反向代理
服务器本地运行时文件
HTTPS
```

## 运行时数据目录

```text
/var/lib/classquest/
├── db/
├── uploads/
├── exports/
└── backups/
```

运行时数据不能写入仓库源码目录。


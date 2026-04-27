<!--
文件说明：ClassQuest backend/ 目录结构真相源。
职责：记录后端顶层目录职责、依赖方向和运行时路径，不穿透到模块 4 内部业务细节。
更新触发：后端目录、core/shared/modules/scripts 分层或运行时路径变化时，需要同步更新本文件。
-->

# FILE-STRUCTURE — backend

## 结构

```text
backend/
├── README.md
├── FILE-STRUCTURE.md
├── requirements.txt
├── .gitignore
├── app/
│   ├── main.py
│   ├── core/
│   ├── modules/
│   │   └── module4/
│   └── shared/
└── scripts/
```

## 职责

- `app/main.py`：FastAPI 应用入口和健康检查。
- `app/core/`：配置、安全、数据库连接等项目级基础能力。
- `app/modules/`：后端模块域，目前只有模块 4。
- `app/shared/`：后端业务无关工具。
- `scripts/`：初始化、备份、统计重算等运维脚本。

## 依赖方向

```text
main → core / modules / shared
routers → services → database/file layer
shared → 不依赖模块业务
```

## 运行时路径

```text
/var/lib/classquest/db/classquest.sqlite
/var/lib/classquest/uploads/
/var/lib/classquest/exports/
/var/lib/classquest/backups/
```


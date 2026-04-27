<!--
文件说明：ClassQuest V1.5 部署模型。
职责：描述 OSS 静态前端、轻量服务器后端、运行时目录和上线前检查项。
更新触发：部署域名、服务器路径、备份方式或上线门槛变化时，需要同步更新本文件。
-->

# Deployment V1.5

## 目标部署

```text
Frontend:
- Vite build output
- OSS 静态托管

Backend:
- 轻量服务器
- Nginx
- FastAPI
- SQLite
- 本地运行时文件
```

## 前端环境变量

```env
VITE_API_BASE_URL=https://api.classquest.example.cn
```

## 后端运行时路径

```text
/var/lib/classquest/
├── db/classquest.sqlite
├── uploads/
├── exports/
└── backups/
```

## 上线前必须具备

HTTPS、教师登录、上传目录不可公开浏览、SQLite 备份脚本、CORS 白名单、文件上传大小与类型限制。


-- 文件说明：模块 4 课时 5 账号、班级与教师班级授权 schema。
-- 职责：为课时 5 云端运行时提供班级、教师/管理员/demo 用户、班级授权和登录会话的基础表。
-- 更新触发：登录角色、班级授权模型、会话字段或课时 5 权限边界变化时，需要同步更新本文件。

CREATE TABLE IF NOT EXISTS cq_classes (
  class_id TEXT PRIMARY KEY,
  class_name TEXT NOT NULL,
  grade_label TEXT NOT NULL DEFAULT '七年级',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cq_users (
  user_id TEXT PRIMARY KEY,
  account TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'demo')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cq_teacher_class_assignments (
  assignment_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  class_name TEXT NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('manage', 'view')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, class_id),
  FOREIGN KEY(user_id) REFERENCES cq_users(user_id),
  FOREIGN KEY(class_id) REFERENCES cq_classes(class_id)
);

CREATE TABLE IF NOT EXISTS cq_auth_sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  revoked_at TEXT,
  FOREIGN KEY(user_id) REFERENCES cq_users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_cq_teacher_class_user
ON cq_teacher_class_assignments(user_id);

CREATE INDEX IF NOT EXISTS idx_cq_teacher_class_class
ON cq_teacher_class_assignments(class_id);

CREATE INDEX IF NOT EXISTS idx_cq_auth_sessions_user
ON cq_auth_sessions(user_id);

-- 文件说明：模块 4 课时 4 同伴互审请求表 schema。
-- 职责：定义第 1 关同伴互审中转站的 SQLite 表与索引，供 B0 数据库初始化加载。
-- 更新触发：互审状态机、请求/反馈 JSON 持久化字段、过期策略或索引查询模式变化时，需要同步更新本文件。

CREATE TABLE IF NOT EXISTS module4_lesson4_review_requests (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,

  author_seat_code TEXT NOT NULL,
  target_reviewer_seat_code TEXT NOT NULL,
  claimed_reviewer_seat_code TEXT,

  invite_code TEXT NOT NULL,
  status TEXT NOT NULL,

  request_json TEXT NOT NULL,
  review_json TEXT,

  created_at TEXT NOT NULL,
  pending_expires_at TEXT NOT NULL,

  claimed_at TEXT,
  review_expires_at TEXT,

  submitted_at TEXT,
  pulled_at TEXT,

  cancelled_at TEXT,
  expired_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_lesson4_review_author_active
ON module4_lesson4_review_requests(class_id, author_seat_code, status);

CREATE INDEX IF NOT EXISTS idx_lesson4_review_target_active
ON module4_lesson4_review_requests(class_id, target_reviewer_seat_code, status);

CREATE INDEX IF NOT EXISTS idx_lesson4_review_reviewer_recovery
ON module4_lesson4_review_requests(class_id, claimed_reviewer_seat_code, status);

CREATE INDEX IF NOT EXISTS idx_lesson4_review_status_expiry
ON module4_lesson4_review_requests(status, pending_expires_at, review_expires_at);

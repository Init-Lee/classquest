-- 文件说明：模块 4 课时 5 班级长期题池 schema。
-- 职责：保存学生 V2/V3 题卡条目与版本，作为教师锁定课时 5 session 题池的长期来源。
-- 更新触发：题池版本规则、题卡状态、来源追踪字段或内容 hash 口径变化时，需要同步更新本文件。

CREATE TABLE IF NOT EXISTS module4_question_items (
  item_id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  author_seat_code TEXT NOT NULL,
  author_name TEXT NOT NULL,
  card_kind TEXT NOT NULL CHECK (card_kind IN ('news', 'image')),
  current_v2_version_id TEXT,
  current_v3_version_id TEXT,
  status TEXT NOT NULL CHECK (
    status IN ('empty', 'v2_submitted', 'in_trial', 'needs_revision', 'ready_for_lesson6', 'excluded')
  ),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(class_id, author_seat_code, card_kind),
  FOREIGN KEY(class_id) REFERENCES cq_classes(class_id)
);

CREATE TABLE IF NOT EXISTS module4_question_item_versions (
  item_version_id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  version_label TEXT NOT NULL CHECK (version_label IN ('v2', 'v3')),
  source_lesson TEXT NOT NULL CHECK (source_lesson IN ('lesson4', 'lesson5', 'dev_seed')),
  source_session_id TEXT,
  base_version_id TEXT,
  source_package_version TEXT,
  source_lesson4_card_id TEXT,
  source_package_hash TEXT,
  card_json TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  correct_option_key TEXT NOT NULL,
  item_short_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('draft', 'submitted_to_trial_pool', 'used_in_session', 'ready_for_lesson6', 'superseded', 'excluded')
  ),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(item_id, version_label, content_hash),
  FOREIGN KEY(item_id) REFERENCES module4_question_items(item_id),
  FOREIGN KEY(class_id) REFERENCES cq_classes(class_id)
);

CREATE INDEX IF NOT EXISTS idx_m4_items_class_author
ON module4_question_items(class_id, author_seat_code);

CREATE INDEX IF NOT EXISTS idx_m4_items_class_status
ON module4_question_items(class_id, status);

CREATE INDEX IF NOT EXISTS idx_m4_item_versions_item
ON module4_question_item_versions(item_id, version_label, status);

CREATE INDEX IF NOT EXISTS idx_m4_item_versions_class
ON module4_question_item_versions(class_id, version_label, status);

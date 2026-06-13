-- 文件说明：模块 4 课时 6 V3 发布审核与公共挑战 schema。
-- 职责：保存 V3 教师发布确认记录、全局公共题库 view、匿名公共挑战运行记录与分 context 统计缓存。
-- 更新触发：课时 6 发布审核状态、公共题库入选条件、匿名挑战记录结构或统计口径变化时，需要同步更新本文件。

CREATE TABLE IF NOT EXISTS module4_v3_publication_reviews (
  review_id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  item_version_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  card_kind TEXT NOT NULL CHECK (card_kind IN ('news', 'image')),
  check_status TEXT NOT NULL CHECK (check_status IN ('pending_teacher_check', 'publishable')),
  is_active_public INTEGER NOT NULL DEFAULT 0,
  checked_by_user_id TEXT,
  checked_at TEXT,
  teacher_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(item_version_id),
  FOREIGN KEY(item_id) REFERENCES module4_question_items(item_id),
  FOREIGN KEY(item_version_id) REFERENCES module4_question_item_versions(item_version_id),
  FOREIGN KEY(class_id) REFERENCES cq_classes(class_id),
  FOREIGN KEY(checked_by_user_id) REFERENCES cq_users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_m4_v3_pub_status
ON module4_v3_publication_reviews(check_status, is_active_public);

CREATE INDEX IF NOT EXISTS idx_m4_v3_pub_class_status
ON module4_v3_publication_reviews(class_id, check_status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_m4_v3_pub_active_per_item
ON module4_v3_publication_reviews(item_id)
WHERE is_active_public = 1;

CREATE VIEW IF NOT EXISTS module4_public_question_bank AS
SELECT
  r.review_id,
  r.item_id,
  r.item_version_id,
  r.class_id,
  r.card_kind,
  v.card_json,
  v.correct_option_key,
  v.item_short_name,
  r.checked_at
FROM module4_v3_publication_reviews r
JOIN module4_question_item_versions v
  ON v.item_version_id = r.item_version_id
WHERE r.check_status = 'publishable'
  AND r.is_active_public = 1
  AND v.version_label = 'v3';

CREATE TABLE IF NOT EXISTS module4_public_challenge_runs (
  run_id TEXT PRIMARY KEY,
  context TEXT NOT NULL CHECK (context IN ('lesson6_class', 'public_showcase')),
  anon_session_hash TEXT NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 6,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  user_agent_hash TEXT,
  ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_m4_public_runs_context_started
ON module4_public_challenge_runs(context, started_at);

CREATE INDEX IF NOT EXISTS idx_m4_public_runs_anon
ON module4_public_challenge_runs(anon_session_hash, started_at);

CREATE TABLE IF NOT EXISTS module4_public_challenge_run_items (
  run_item_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_version_id TEXT NOT NULL,
  card_kind TEXT NOT NULL CHECK (card_kind IN ('news', 'image')),
  order_index INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('assigned', 'answered')),
  assigned_at TEXT NOT NULL,
  answered_at TEXT,
  UNIQUE(run_id, item_version_id),
  UNIQUE(run_id, order_index),
  FOREIGN KEY(run_id) REFERENCES module4_public_challenge_runs(run_id),
  FOREIGN KEY(item_id) REFERENCES module4_question_items(item_id),
  FOREIGN KEY(item_version_id) REFERENCES module4_question_item_versions(item_version_id)
);

CREATE INDEX IF NOT EXISTS idx_m4_public_run_items_run
ON module4_public_challenge_run_items(run_id, order_index);

CREATE INDEX IF NOT EXISTS idx_m4_public_run_items_version
ON module4_public_challenge_run_items(item_version_id);

CREATE TABLE IF NOT EXISTS module4_public_challenge_answers (
  answer_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  run_item_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_version_id TEXT NOT NULL,
  context TEXT NOT NULL CHECK (context IN ('lesson6_class', 'public_showcase')),
  selected_option_key TEXT NOT NULL,
  correct_option_key TEXT NOT NULL,
  is_correct INTEGER NOT NULL,
  duration_ms INTEGER,
  answered_at TEXT NOT NULL,
  UNIQUE(run_item_id),
  FOREIGN KEY(run_id) REFERENCES module4_public_challenge_runs(run_id),
  FOREIGN KEY(run_item_id) REFERENCES module4_public_challenge_run_items(run_item_id),
  FOREIGN KEY(item_id) REFERENCES module4_question_items(item_id),
  FOREIGN KEY(item_version_id) REFERENCES module4_question_item_versions(item_version_id)
);

CREATE INDEX IF NOT EXISTS idx_m4_public_answers_version_context
ON module4_public_challenge_answers(item_version_id, context);

CREATE INDEX IF NOT EXISTS idx_m4_public_answers_run
ON module4_public_challenge_answers(run_id);

CREATE TABLE IF NOT EXISTS module4_public_question_stats (
  item_version_id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  total_answer_count INTEGER NOT NULL DEFAULT 0,
  total_correct_count INTEGER NOT NULL DEFAULT 0,
  total_correct_rate REAL NOT NULL DEFAULT 0,
  lesson6_class_answer_count INTEGER NOT NULL DEFAULT 0,
  lesson6_class_correct_count INTEGER NOT NULL DEFAULT 0,
  lesson6_class_correct_rate REAL NOT NULL DEFAULT 0,
  public_showcase_answer_count INTEGER NOT NULL DEFAULT 0,
  public_showcase_correct_count INTEGER NOT NULL DEFAULT 0,
  public_showcase_correct_rate REAL NOT NULL DEFAULT 0,
  last_answered_at TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(item_id) REFERENCES module4_question_items(item_id),
  FOREIGN KEY(item_version_id) REFERENCES module4_question_item_versions(item_version_id)
);

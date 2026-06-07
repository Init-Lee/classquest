-- 文件说明：模块 4 课时 5 云端课堂运行时 schema。
-- 职责：保存 lesson5 session、冻结题池、参与者、分配、作答、评分、统计、修订计划与事件日志。
-- 更新触发：课时 5 状态机、分配/作答/评分口径、统计字段或 V3 修订链路变化时，需要同步更新本文件。

CREATE TABLE IF NOT EXISTS module4_lesson5_sessions (
  session_id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  class_name TEXT NOT NULL,
  title TEXT NOT NULL,

  run_type TEXT NOT NULL CHECK (run_type IN ('normal', 'makeup', 'test')),

  phase TEXT NOT NULL CHECK (
    phase IN (
      'draft',
      'pool_locked',
      'trial_open',
      'trial_locked',
      'analytics_open',
      'revision_open',
      'closed'
    )
  ),

  settings_json TEXT NOT NULL,

  created_by_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  pool_locked_at TEXT,
  trial_opened_at TEXT,
  trial_locked_at TEXT,
  analytics_opened_at TEXT,
  revision_opened_at TEXT,
  closed_at TEXT,

  FOREIGN KEY(class_id) REFERENCES cq_classes(class_id),
  FOREIGN KEY(created_by_user_id) REFERENCES cq_users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_l5_sessions_class_phase
ON module4_lesson5_sessions(class_id, phase);

CREATE INDEX IF NOT EXISTS idx_l5_sessions_created
ON module4_lesson5_sessions(created_at);

-- -------------------------------------------------------------------
-- Frozen per-session pool
-- -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS module4_lesson5_session_pool_items (
  session_pool_item_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  class_id TEXT NOT NULL,

  item_id TEXT NOT NULL,
  item_version_id TEXT NOT NULL,

  author_seat_code TEXT NOT NULL,
  author_name TEXT NOT NULL,
  card_kind TEXT NOT NULL CHECK (card_kind IN ('news', 'image')),

  included_at TEXT NOT NULL,

  UNIQUE(session_id, item_version_id),

  FOREIGN KEY(session_id) REFERENCES module4_lesson5_sessions(session_id),
  FOREIGN KEY(item_id) REFERENCES module4_question_items(item_id),
  FOREIGN KEY(item_version_id) REFERENCES module4_question_item_versions(item_version_id)
);

CREATE INDEX IF NOT EXISTS idx_l5_session_pool_kind
ON module4_lesson5_session_pool_items(session_id, card_kind);

CREATE INDEX IF NOT EXISTS idx_l5_session_pool_author
ON module4_lesson5_session_pool_items(session_id, author_seat_code);

-- -------------------------------------------------------------------
-- Participants and assignments
-- -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS module4_lesson5_participants (
  participant_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  class_id TEXT NOT NULL,

  student_name TEXT NOT NULL,
  class_seat_code TEXT NOT NULL,

  lesson5_client_id TEXT NOT NULL,

  joined_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,

  UNIQUE(session_id, class_seat_code),
  UNIQUE(session_id, lesson5_client_id),

  FOREIGN KEY(session_id) REFERENCES module4_lesson5_sessions(session_id)
);

CREATE INDEX IF NOT EXISTS idx_l5_participants_session
ON module4_lesson5_participants(session_id);

CREATE TABLE IF NOT EXISTS module4_lesson5_assignments (
  assignment_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,

  respondent_seat_code TEXT NOT NULL,

  session_pool_item_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_version_id TEXT NOT NULL,

  order_index INTEGER NOT NULL,
  assignment_reason TEXT NOT NULL,
  is_required INTEGER NOT NULL DEFAULT 1,

  status TEXT NOT NULL CHECK (status IN ('assigned', 'answered', 'rated', 'skipped')),

  created_at TEXT NOT NULL,

  UNIQUE(session_id, participant_id, item_version_id),
  UNIQUE(session_id, participant_id, order_index),

  FOREIGN KEY(session_id) REFERENCES module4_lesson5_sessions(session_id),
  FOREIGN KEY(participant_id) REFERENCES module4_lesson5_participants(participant_id),
  FOREIGN KEY(session_pool_item_id) REFERENCES module4_lesson5_session_pool_items(session_pool_item_id),
  FOREIGN KEY(item_id) REFERENCES module4_question_items(item_id),
  FOREIGN KEY(item_version_id) REFERENCES module4_question_item_versions(item_version_id)
);

CREATE INDEX IF NOT EXISTS idx_l5_assignments_participant
ON module4_lesson5_assignments(session_id, participant_id, order_index);

CREATE INDEX IF NOT EXISTS idx_l5_assignments_item_version
ON module4_lesson5_assignments(session_id, item_version_id);

-- -------------------------------------------------------------------
-- Answers and ratings
-- -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS module4_lesson5_answers (
  answer_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  assignment_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,

  item_id TEXT NOT NULL,
  item_version_id TEXT NOT NULL,

  respondent_seat_code TEXT NOT NULL,

  selected_option_key TEXT NOT NULL,
  correct_option_key TEXT NOT NULL,
  is_correct INTEGER NOT NULL,

  is_first_valid_attempt INTEGER NOT NULL DEFAULT 1,
  excluded_from_stats INTEGER NOT NULL DEFAULT 0,
  excluded_reason TEXT,

  idempotency_key TEXT,
  answered_at TEXT NOT NULL,

  UNIQUE(assignment_id),

  FOREIGN KEY(session_id) REFERENCES module4_lesson5_sessions(session_id),
  FOREIGN KEY(assignment_id) REFERENCES module4_lesson5_assignments(assignment_id),
  FOREIGN KEY(participant_id) REFERENCES module4_lesson5_participants(participant_id),
  FOREIGN KEY(item_id) REFERENCES module4_question_items(item_id),
  FOREIGN KEY(item_version_id) REFERENCES module4_question_item_versions(item_version_id)
);

CREATE INDEX IF NOT EXISTS idx_l5_answers_item_stats
ON module4_lesson5_answers(session_id, item_version_id, excluded_from_stats);

CREATE INDEX IF NOT EXISTS idx_l5_answers_participant
ON module4_lesson5_answers(session_id, participant_id);

CREATE TABLE IF NOT EXISTS module4_lesson5_ratings (
  rating_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  answer_id TEXT NOT NULL,
  assignment_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,

  item_id TEXT NOT NULL,
  item_version_id TEXT NOT NULL,

  respondent_seat_code TEXT NOT NULL,

  clarity INTEGER NOT NULL CHECK (clarity IN (1, 2, 3)),
  thinking_value INTEGER NOT NULL CHECK (thinking_value IN (1, 2, 3)),
  explanation_helpfulness INTEGER NOT NULL CHECK (explanation_helpfulness IN (1, 2, 3)),

  issue_flags_json TEXT NOT NULL,
  comment TEXT NOT NULL DEFAULT '',

  is_first_valid_rating INTEGER NOT NULL DEFAULT 1,
  excluded_from_stats INTEGER NOT NULL DEFAULT 0,

  rated_at TEXT NOT NULL,

  UNIQUE(answer_id),

  FOREIGN KEY(session_id) REFERENCES module4_lesson5_sessions(session_id),
  FOREIGN KEY(answer_id) REFERENCES module4_lesson5_answers(answer_id),
  FOREIGN KEY(assignment_id) REFERENCES module4_lesson5_assignments(assignment_id),
  FOREIGN KEY(participant_id) REFERENCES module4_lesson5_participants(participant_id),
  FOREIGN KEY(item_id) REFERENCES module4_question_items(item_id),
  FOREIGN KEY(item_version_id) REFERENCES module4_question_item_versions(item_version_id)
);

CREATE INDEX IF NOT EXISTS idx_l5_ratings_item_stats
ON module4_lesson5_ratings(session_id, item_version_id, excluded_from_stats);

CREATE INDEX IF NOT EXISTS idx_l5_ratings_participant
ON module4_lesson5_ratings(session_id, participant_id);

-- -------------------------------------------------------------------
-- Stats
-- -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS module4_lesson5_item_stats (
  stat_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_version_id TEXT NOT NULL,

  valid_answer_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  correct_rate REAL NOT NULL DEFAULT 0,

  avg_clarity REAL,
  avg_thinking_value REAL,
  avg_explanation_helpfulness REAL,

  issue_flag_count INTEGER NOT NULL DEFAULT 0,
  issue_flag_rate REAL NOT NULL DEFAULT 0,

  issue_flags_json TEXT NOT NULL,
  sample_comments_json TEXT NOT NULL,

  stats_status TEXT NOT NULL CHECK (stats_status IN ('insufficient', 'preliminary', 'stable')),
  computed_at TEXT NOT NULL,

  UNIQUE(session_id, item_version_id),

  FOREIGN KEY(session_id) REFERENCES module4_lesson5_sessions(session_id),
  FOREIGN KEY(item_id) REFERENCES module4_question_items(item_id),
  FOREIGN KEY(item_version_id) REFERENCES module4_question_item_versions(item_version_id)
);

CREATE INDEX IF NOT EXISTS idx_l5_item_stats_session
ON module4_lesson5_item_stats(session_id, stats_status);

CREATE INDEX IF NOT EXISTS idx_l5_item_stats_item
ON module4_lesson5_item_stats(item_id);

-- -------------------------------------------------------------------
-- Revision plans and V3 linkage
-- -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS module4_lesson5_revision_plans (
  revision_plan_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,

  student_seat_code TEXT NOT NULL,

  item_id TEXT NOT NULL,
  base_v2_version_id TEXT NOT NULL,
  v3_item_version_id TEXT,

  card_kind TEXT NOT NULL CHECK (card_kind IN ('news', 'image')),

  diagnosis_json TEXT NOT NULL,

  revision_action TEXT NOT NULL CHECK (revision_action IN ('keep', 'minor_fix', 'major_fix', 'hold')),

  revision_reason TEXT NOT NULL DEFAULT '',
  expected_effect TEXT NOT NULL DEFAULT '',

  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted')),

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  submitted_at TEXT,

  UNIQUE(session_id, participant_id, item_id),

  FOREIGN KEY(session_id) REFERENCES module4_lesson5_sessions(session_id),
  FOREIGN KEY(participant_id) REFERENCES module4_lesson5_participants(participant_id),
  FOREIGN KEY(item_id) REFERENCES module4_question_items(item_id),
  FOREIGN KEY(base_v2_version_id) REFERENCES module4_question_item_versions(item_version_id),
  FOREIGN KEY(v3_item_version_id) REFERENCES module4_question_item_versions(item_version_id)
);

CREATE INDEX IF NOT EXISTS idx_l5_revision_participant
ON module4_lesson5_revision_plans(session_id, participant_id);

CREATE INDEX IF NOT EXISTS idx_l5_revision_item
ON module4_lesson5_revision_plans(session_id, item_id);

-- -------------------------------------------------------------------
-- Events
-- -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS module4_lesson5_events (
  event_id TEXT PRIMARY KEY,
  session_id TEXT,
  actor_role TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_l5_events_session
ON module4_lesson5_events(session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_l5_events_type
ON module4_lesson5_events(event_type, created_at);

<!--
文件说明：ClassQuest repository-facing English README.
职责：Provide the English entry point for project positioning, platform architecture, module status, setup, stack, version strategy, and documentation links.
更新触发：When README.md changes its project positioning, feature scope, setup steps, stack, deployment model, module status, or release/version policy, this file must be updated in sync.
-->

# ClassQuest — Programmatic Teaching Platform

> A classroom-oriented programmatic teaching platform. ClassQuest is currently being refactored from a single-module app into a platform portal with independent curriculum modules and a lightweight V1.5 backend.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tech Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20TypeScript-61DAFB)](https://vitejs.dev)
[![Chinese](https://img.shields.io/badge/README-中文-red)](README.md)
[![Release](https://img.shields.io/badge/release-v0.7.3-emerald)](https://github.com/Init-Lee/classquest/releases)

## Current Architecture Goal

```text
Platform Portal → Module → Lesson → Step
```

```text
src/
├── platform/                         # Platform portal, global routes, module registry
├── modules/
│   ├── module-3-ai-science-station/   # Completed Module 3: AI Science Station
│   └── module-4-ai-info-detective/    # Module 4: AI Information Detective, Lessons 1-4 open; Lesson 4 Step1-Step4 complete
└── shared/                            # Business-neutral UI and pure utilities

backend/                              # V1.5 lightweight FastAPI backend with Module 4 Lesson 3/4 APIs
```

## Module Status

- **Module 3 · AI Science Station**: completed with 6 lessons and 24 steps. It preserves local-first progress, continue packages, cross-role file flow, stage snapshots, and teacher demo mode. See `src/modules/module-3-ai-science-station/README.md`.
- **Module 4 · AI Information Detective**: Lessons 1 "Framework Release and Sample Analysis", 2 "Material Collection and Compliance Pre-check", 3 "Question Card V1 Authoring and Explanation Writing", and 4 "Peer Review and V2 Entry Preparation" are open with an independent local portfolio, continue packages, stage snapshots, and teacher demo mode. Lesson 4 now covers Step1-Step4: peer review, feedback handling, the V2 revision workbench, the V2 readiness report, and the `ready_for_lesson5` package with QuickCheck / `stageSnapshot`. Lesson 5 will enter the "Cloud Live Lesson Session" planning/development phase and is only the next-stage entry point for now. See `src/modules/module-4-ai-info-detective/README.md`.
- **V1.5 Backend**: provides the health check, Module 4 Lesson 3 AI review API (mock / Qwen), the Lesson 4 peer-review SQLite base, Lesson 4 B1-B7 peer-review endpoints (create, status, cancel, inbox, claim, submit, pull/recovery), and `moderate-text` review moderation. See `backend/README.md`.

## Getting Started

Requirements: Node.js >= 18.

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

Module 4 Lesson 4 backend integration runs from `backend/` with `CLASSQUEST_DATABASE_PATH=runtime/db/classquest.sqlite` and `PYTHONPATH=.`; initialize with `python scripts/init_db.py`, then start `uvicorn app.main:app --reload`. In frontend `.env.local`, set `VITE_MODULE4_LESSON4_PEER_REVIEW_MODE=http` and optionally `VITE_MODULE4_LESSON4_REVIEW_MODERATION_MODE=http` for backend text moderation. See [`backend/README.md`](backend/README.md) and [`src/modules/module-4-ai-info-detective/lessons/lesson-4/README.md`](src/modules/module-4-ai-info-detective/lessons/lesson-4/README.md).

Production build:

```bash
npm run build
```

## Tech Stack

- Frontend: React + TypeScript + Vite
- Routing: React Router v6
- UI: Tailwind CSS + shadcn-style local wrappers
- Module 3 / Module 4 local data: browser local storage + continue package export/import
- V1.5 backend target: FastAPI + SQLite + local runtime files + Nginx + HTTPS

## Deployment Model (V1.5)

```text
Frontend: Vite build output → OSS static hosting
Backend: lightweight server → Nginx → FastAPI → SQLite / local runtime files
```

For OSS static frontend direct-to-backend deployment (option B), copy `.env.production.example` to `.env.production` before production build and set `VITE_API_BASE_URL`; the server-side `backend/.env` must configure `CORS_ALLOWED_ORIGINS` for the OSS domain. See `docs/DEPLOYMENT-V1_5.md`.

## Branching and Version Strategy

- Current mainline release: `v0.7.3`, after merging the local-first Module 4 Lesson 3 flow. Mainline documentation now reflects the actual Lesson 4 Step1-Step4, V2 ready package, and Lesson 4 backend routes boundary.
- Previous milestone: `v0.7.2`, the Module 4 Lesson 2 material collection and compliance pre-check flow.
- Earlier milestone: `v0.6.0`, when Module 3 shipped as a single-app layout.
- Later Module 4 work: one branch per lesson. Lesson 5 will enter the "Cloud Live Lesson Session" planning/development phase; admin / Live Session roles are starting integration and planning, not completed.
- After Module 4 mock workflows stabilize: move toward `v0.8.0`.
- After Module 4 connects to the real backend: move toward `v0.9.0`.

Note: `appVersion` inside student learning packages tracks the data-package format and is maintained separately from the product release number.

## Documentation Entry Points

- `FILE-STRUCTURE.md`: repository structure source of truth, limited to platform/module-level boundaries.
- `docs/CURSOR-START-HERE.md`: development entry guide.
- `docs/MIGRATION-PLAN.md`: platform migration plan.
- `docs/ARCHITECTURE-V1_5.md`: V1.5 architecture overview.
- `.cursor/rules/classquest-platform.mdc`: Cursor development rules.

## License

[MIT License](LICENSE) © 2026 ClassQuest Contributors

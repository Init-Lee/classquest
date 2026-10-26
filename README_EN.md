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
[![Release](https://img.shields.io/badge/release-module4--lesson6--v0.7.7-emerald)](https://github.com/Init-Lee/classquest/releases)

## Current Architecture Goal

```text
Platform Portal → Module → Lesson → Step
```

```text
src/
├── platform/                         # Platform portal, global routes, module registry
├── modules/
│   ├── module-1-ai-story/             # Module 1: Future Letter, Lessons 1-2 open
│   ├── module-2-ai-comic/             # Module 2: under construction; novel import and learning package exist, lesson 1 pages do not
│   ├── module-3-ai-science-station/   # Completed Module 3: AI Science Station
│   └── module-4-ai-info-detective/    # Module 4: AI Information Detective, Lessons 1-6 open
└── shared/                            # Business-neutral UI and pure utilities

backend/                              # V1.5 lightweight FastAPI backend for Module 4 Lessons 3-6
```

## Module Status

- **Module 1 · Future Letter**: a six-lesson AI storytelling project. Phase 2 opens Lessons 1 and 2 for choosing an SDG, a concrete city issue, an audience, a writing style, and a four-part character arc. It includes an independent local portfolio, version 1 continuation package, passphrase-gated teacher lecture mode, and per-lesson stage snapshots downloaded from completed home-page lesson cards for homework; Lessons 3-6 and the derived complete-story view remain locked for later phases. See `src/modules/module-1-ai-story/README.md`.
- **Module 2 · AI Four-Panel Comic (under construction)**: a six-lesson image-generation project that adapts each student's Module 1 story into a four-panel comic; images are generated in external AI tools. Novel import parsing and the learning package are in place; Lesson 1 pages are not implemented yet. The portal entry stays a draft placeholder. See `src/modules/module-2-ai-comic/README.md`.
- **Module 3 · AI Science Station**: completed with 6 lessons and 24 steps. It preserves local-first progress, continue packages, cross-role file flow, stage snapshots, and teacher demo mode. See `src/modules/module-3-ai-science-station/README.md`.
- **Module 4 · AI Information Detective**: Lessons 1-6 are open. Lessons 1-4 cover local authoring and peer review; Lesson 5 covers the Live Lesson Session student flow and teacher console; Lesson 6 covers V3 publication review, the student three-step flow, and the anonymous public challenge. See `src/modules/module-4-ai-info-detective/README.md`.
- **V1.5 Backend**: provides the health check, Module 4 Lesson 3 AI review, Lesson 4 peer-review APIs, Lesson 5 Live Lesson Session APIs, and Lesson 6 publication review / public-challenge / stats APIs. See `backend/README.md`.

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
- Module 1 / Module 3 / Module 4 local data: browser local storage + continuation-package export/import
- V1.5 backend target: FastAPI + SQLite + local runtime files + Nginx + HTTPS

## Deployment Model (V1.5)

```text
Frontend: Vite build output → OSS static hosting
Backend: lightweight server → Nginx → FastAPI → SQLite / local runtime files
```

For OSS static frontend direct-to-backend deployment (option B), copy `.env.production.example` to `.env.production` before production build and set `VITE_API_BASE_URL`; the server-side `backend/.env` must configure `CORS_ALLOWED_ORIGINS` for the OSS domain. See `docs/DEPLOYMENT-V1_5.md`.

## Branching and Version Strategy

- Current lesson-branch release: `module4-lesson6-v0.7.7`, wrapping Module 4 Lesson 6 publication review, public challenge, teacher stats, and documentation.
- Previous milestones: `module4-lesson6-v0.7.6` (Lesson 6 feature close), `module4-lesson5-v0.7.5` (Lesson 5 Live Lesson Session), `v0.7.2` (Lesson 2), `v0.6.0` (Module 3 complete).
- Module 4 continues on per-lesson branches. Teacher classroom guides: `docs/TEACHER-GUIDE-MODULE4-LESSON5.md` and `docs/TEACHER-GUIDE-MODULE4-LESSON6.md`.

Note: `appVersion` inside student learning packages tracks the data-package format and is maintained separately from the product release number.

Module 1 Phase 1 is developed on `module-1-lesson-1-dev`; its data-package `appVersion` is `0.1.0`.

## Documentation Entry Points

- `FILE-STRUCTURE.md`: repository structure source of truth, limited to platform/module-level boundaries.
- `docs/DOCS-INDEX.md`: architecture and development document index.
- `docs/TEACHER-GUIDE-MODULE4-LESSON5.md`: Lesson 5 teacher classroom guide.
- `docs/TEACHER-GUIDE-MODULE4-LESSON6.md`: Lesson 6 teacher classroom guide.
- `docs/CURSOR-START-HERE.md`: development entry guide.
- `docs/ARCHITECTURE-V1_5.md`: V1.5 architecture overview.

## License

[MIT License](LICENSE) © 2026 ClassQuest Contributors

# ClassQuest — A Programmatic Teaching Platform

> A student-driven, gamified learning platform built for the classroom — offline-first, teacher-light, and built to scale.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tech Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20TypeScript-61DAFB)](https://vitejs.dev)
[![中文](https://img.shields.io/badge/README-中文-red)](README.md)

---

## Background

ClassQuest is an experiment in **programmatic teaching** — designed for middle school classrooms, with its first deployment serving a Grade 7 "AI Science Communication" curriculum (Module 3).

In traditional classrooms, teachers carry the full burden of lecturing and guidance, leaving students with little structure for self-directed learning. ClassQuest restructures a course into **Units → Levels → Sub-steps**, allowing students to progress independently through clearly defined tasks while teachers shift to a facilitation and coaching role.

**Our hope is that more teachers will adopt it as a teaching aid.**

🇨🇳 [中文版本 →](README.md)

---

## Key Features

| Feature | Description |
|---------|-------------|
| Gamified learning | Structured unit progression (Units 1–2: 5 levels each; Unit 3: levels 1–3 shipped), each with Guards |
| Offline-first | Built on IndexedDB — works without internet |
| Portable progress | Export a "Continue Package" (JSON) anytime; import it on any device to resume |
| Group collaboration | Leader-member workflow — leader exports a group file, members import and see their assignments |
| Stage snapshots | Generate HTML snapshots at key milestones for submission to Moodle or printing |
| AI assistant guidance | Provides prompt templates and links to AI tools (e.g. Doubao) to scaffold student thinking |
| Teacher demo mode | Password-protected demo mode with pre-filled data, bypassing all Guards for presentation use |
| Legacy data migration | Import wizard for migrating data from previous tool versions into the new system |
| Extensible architecture | Repository abstraction isolates the data layer — ready for a backend when needed |

---

## Current Coverage

- **Unit 1**: Project Launch & Topic Framing (5 levels)
- **Unit 2**: Evidence Collection & Documentation (5 levels)
- **Unit 3**: Asset organization & evidence processing — **levels 1–3 implemented** (inherit anchor → toolbox & wording lock → select materials); levels 4–5 are placeholders
- Units 4–6: Architecture scaffolded

> Unit 3 level 2 persists “what I noticed” and “why it matters on the poster” drafts plus a confirmation flag in `Lesson3State`, with merge-on-import/load for older packages — see **“课时3 · 结构摘要”** in [FILE-STRUCTURE.md](FILE-STRUCTURE.md) (Chinese; structural truth source).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Build | Vite |
| Framework | React 18 + TypeScript |
| UI Library | shadcn/ui + Tailwind CSS v3 |
| Display fonts | `@fontsource/noto-serif-sc` / `@fontsource/cormorant-garamond` (bundled via npm + Vite; **no online font CDN**) |
| Routing | React Router v6 (lazy loading) |
| Data Layer | IndexedDB (local-first) |
| State Management | React Context + Reducer |

---

## Getting Started

**Requirements**: Node.js >= 18

```bash
# Clone the repo
git clone https://github.com/Init-Lee/classquest.git
cd classquest

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Status

| Phase | Status |
|-------|--------|
| Phase 0: Project init + open source files | ✅ Done |
| Phase 1: Shell & navigation | ✅ Done |
| Phase 2: Data foundation (IndexedDB + continue package) | ✅ Done |
| Phase 3: Unit 1 (5 levels + AI assistant + snapshots) | ✅ Done |
| Phase 4: Unit 2 (5 levels + group sync + dual evidence templates + quality check) | ✅ Done |
| Phase 5: Polish (bug fixes, Guard optimization, data model refactor) | ✅ Done |
| Phase 6: Unit 3 development | 🚧 In Progress (levels 1–3 live; level 2: cross-unit material reference feature, wording lock, poster spotlight dialog) |
| Phase 7: UI/UX visual polish (color system, typography, responsive) | 📋 Planned |

---

## Roadmap

- [x] Unit 1 full progression (5 levels)
- [x] Unit 2 full progression (5 levels)
- [x] Group collaboration (leader file export / member import)
- [x] Legacy data migration wizard (temporary feature)
- [🚧] Unit 3 (levels 1–3 done; levels 4–5 pending)
- [ ] Units 4–6 implementation
- [ ] AI assistant API integration (currently prompt templates + external links)
- [ ] Teacher dashboard
- [ ] Backend sync support

---

## Contributing

Teachers, education technology researchers, and developers are all welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

[MIT License](LICENSE) © 2026 ClassQuest Contributors

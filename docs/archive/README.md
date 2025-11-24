# Archived Documentation

This folder contains historical documentation from the initial development phase (2023). These documents are **preserved for reference only** but are **no longer accurate or complete**.

**⚠️ Important:** These specs may contradict the current implementation. Always refer to the current documentation in the parent directory.

---

## 📦 Contents

### project_plan.md
**Original Assumptions MVP specification**

**Created:** 2023
**Archived:** 2025-11-25
**Status:** ⛔ Outdated - Superseded by [ARCHITECTURE.md](../ARCHITECTURE.md)

**Why archived:**
- Missing implemented phases (VOTING, REVEAL)
- Doesn't cover Imposter game (which is now implemented)
- Database schema incomplete (missing votes table, score fields)
- References Next.js 14 (we're on Next.js 16)
- Contains completed task lists no longer relevant
- Agent-specific workflow instructions not needed

**What's still useful:**
- Original design intent and reasoning
- Historical context for architectural decisions

---

### IMPOSTER_GAME.md
**Original Imposter game specification**

**Created:** 2023
**Archived:** 2025-11-25
**Status:** ⛔ Outdated - Superseded by [GAME_FLOWS.md](../GAME_FLOWS.md)

**Why archived:**
- State machine differs from implementation (shows CLUE and DISCUSSION as separate phases)
- Database schema missing fields
- Implementation details contradict actual code
- Less detailed than current documentation

**What's still useful:**
- Word lists for topics (reference for future expansion)
- Original design rationale and game mechanics ideas

---

## 📖 Current Documentation

**For accurate, up-to-date information, see:**

- **[../README.md](../README.md)** - Documentation index and quick reference
- **[../ARCHITECTURE.md](../ARCHITECTURE.md)** - Complete system architecture
- **[../API_REFERENCE.md](../API_REFERENCE.md)** - All API endpoints
- **[../GAME_FLOWS.md](../GAME_FLOWS.md)** - Game state machines and phases
- **[../DEVELOPMENT.md](../DEVELOPMENT.md)** - Setup and development guide

---

## 🔍 When to Reference Archived Docs

**Good reasons:**
- Understanding original design decisions
- Researching why certain features were/weren't implemented
- Historical context for architecture choices
- Reference for future feature ideas

**Bad reasons:**
- ❌ Implementing new features (use current docs)
- ❌ Understanding current state machine (use GAME_FLOWS.md)
- ❌ Setting up development environment (use DEVELOPMENT.md)
- ❌ Understanding database schema (use ARCHITECTURE.md)

---

## 📝 History

| Date | Event |
|------|-------|
| 2023 | Initial specs written for MVP development |
| 2023-2024 | MVP implemented and extended beyond original spec |
| 2025-11-25 | Comprehensive documentation created, old specs archived |

---

## ⚠️ Disclaimer

**These documents are historical artifacts.** They describe the intended implementation at the time of writing, which may differ significantly from the current codebase. Treat them as design notes rather than specifications.

When in doubt, **trust the code and current documentation over archived specs.**

---

**Archived:** 2025-11-25
**Reason:** Replaced by comprehensive, accurate documentation
**Preserved for:** Historical reference and context

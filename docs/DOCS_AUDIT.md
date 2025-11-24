# Documentation Audit & Recommendations

**Date:** 2025-11-25
**Purpose:** Evaluate existing documentation for accuracy, relevance, and redundancy

---

## Executive Summary

The docs folder now contains **7 documentation files** (4 new, 3 legacy). The new comprehensive documentation supersedes most of the legacy content, but the legacy docs contain useful historical context and future vision.

**Recommendation:** Keep legacy docs but add deprecation notices pointing to new docs.

---

## Documentation Inventory

### ✅ New Documentation (Current & Comprehensive)

| File | Lines | Status | Purpose |
|------|-------|--------|---------|
| **ARCHITECTURE.md** | 600+ | ✅ Current | Complete system architecture, database schema, patterns |
| **API_REFERENCE.md** | 450+ | ✅ Current | All 13 endpoints with examples |
| **GAME_FLOWS.md** | 500+ | ✅ Current | Both game state machines with detailed phases |
| **DEVELOPMENT.md** | 600+ | ✅ Current | Setup, workflow, testing, deployment |

**Total:** ~2,150 lines of current, accurate documentation

### 📦 Legacy Documentation (Historical Reference)

| File | Lines | Status | Issues | Recommendation |
|------|-------|--------|--------|----------------|
| **project_plan.md** | 290 | ⚠️ Outdated | Missing voting/reveal phases, no Imposter coverage, references Next.js 14 (we're on 16), includes completed task lists | **ARCHIVE** - Superseded by ARCHITECTURE.md |
| **prd.md** | 339 | ⚠️ Partially outdated | MVP section accurate but incomplete, extensive future features that may not align with vision, no Imposter game | **KEEP** - Add deprecation notice, useful for future planning |
| **IMPOSTER_GAME.md** | 266 | ⚠️ Outdated | Original spec, schema missing score field, phases described differently than implementation | **ARCHIVE** - Superseded by GAME_FLOWS.md |

---

## Detailed Analysis

### 1. project_plan.md

**What it contains:**
- Original Assumptions game specification (MVP only)
- Database schema (incomplete - missing votes table, score field)
- State machine (missing VOTING and REVEAL phases)
- Tech stack (outdated - says Next.js 14, we're on 16)
- Agent workflow instructions (not relevant to project)
- Task list (completed, no longer needed)

**Problems:**
- ❌ State machine is incomplete (missing 2 phases that ARE implemented)
- ❌ Doesn't mention Imposter game at all
- ❌ Database schema outdated
- ❌ Contains "Claude Code" specific instructions that were for initial build
- ❌ Task list refers to files that have been built

**Recommendation:**
```
🗑️ ARCHIVE (move to docs/archive/project_plan.md)

Reasoning: Everything useful is now in ARCHITECTURE.md and GAME_FLOWS.md,
but more detailed and accurate. The "agent workflow" and "task list"
sections are no longer relevant.
```

---

### 2. prd.md

**What it contains:**
- Product vision and tagline
- Full game feature spec (including future features)
- MVP vs. future phase breakdown
- Extensive feature list (question packs, avatars, timers, etc.)
- Data model
- Technical requirements

**Problems:**
- ❌ MVP section says "Assignment Round" is first phase, but implementation has LOBBY first
- ❌ MVP section doesn't mention VOTING and REVEAL phases (which ARE implemented)
- ❌ Doesn't include Imposter game at all
- ❌ Future features section extensive but may not reflect current product vision
- ⚠️ Data model section is accurate for Assumptions but incomplete

**What's still valuable:**
- ✅ Product vision and positioning
- ✅ Future feature ideas (question packs, custom questions, avatars, etc.)
- ✅ Design philosophy and player experience goals
- ✅ Acceptance criteria

**Recommendation:**
```
📝 KEEP WITH DEPRECATION NOTICE

Add this at the top:
---
> **⚠️ Historical Document**
> This PRD represents the original product vision. For current implementation
> details, see:
> - Current game flows: [GAME_FLOWS.md](GAME_FLOWS.md)
> - Technical architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
> - API documentation: [API_REFERENCE.md](API_REFERENCE.md)
>
> This document is preserved for future feature planning and product vision.
---

Update Section 3 (MVP SCOPE) to accurately reflect what's implemented:
- Add VOTING and REVEAL phases
- Note that both Assumptions AND Imposter games are implemented
```

---

### 3. IMPOSTER_GAME.md

**What it contains:**
- Imposter game technical specification
- Game flow description
- State machine (LOBBY → SETUP → SECRET_REVEAL → CLUE → DISCUSSION → VOTING → REVEAL)
- Topics and word lists
- Database schema
- Implementation scope

**Problems:**
- ❌ State machine shows CLUE phase (not in current implementation)
- ❌ State machine shows DISCUSSION phase (not a separate phase in implementation)
- ❌ Database schema missing `score` field on players table
- ❌ Implementation details differ from actual code
- ❌ Less detailed than GAME_FLOWS.md

**What's still valuable:**
- ✅ Word lists for topics (could be useful reference)
- ✅ Original design rationale

**Recommendation:**
```
🗑️ ARCHIVE (move to docs/archive/IMPOSTER_GAME.md)

Reasoning: GAME_FLOWS.md now has comprehensive, accurate Imposter game
documentation. This original spec is outdated and contradicts implementation.

However, preserve it in archive/ for historical reference, especially the
word lists and original design decisions.
```

---

## Proposed Documentation Structure

```
docs/
├── README.md                      # ← CREATE: Documentation index
├── ARCHITECTURE.md                # ✅ Current
├── API_REFERENCE.md               # ✅ Current
├── GAME_FLOWS.md                  # ✅ Current
├── DEVELOPMENT.md                 # ✅ Current
├── prd.md                         # ⚠️ Keep with deprecation notice
└── archive/                       # ← CREATE: Historical docs
    ├── project_plan.md            # Moved from root
    └── IMPOSTER_GAME.md           # Moved from root
```

---

## Specific Actions Required

### 1. Create docs/README.md (Documentation Index)

```markdown
# Documentation Index

Welcome to the pregame.lol documentation!

## 📖 Current Documentation

Start here for understanding the system:

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design, database, security
- **[API_REFERENCE.md](API_REFERENCE.md)** - Complete API documentation
- **[GAME_FLOWS.md](GAME_FLOWS.md)** - Game state machines and phases
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Setup and development guide

## 🎯 Product Planning

- **[prd.md](prd.md)** - Product requirements and future vision

## 📦 Historical Documents

Archived specifications from initial development:
- [archive/project_plan.md](archive/project_plan.md) - Original Assumptions MVP plan
- [archive/IMPOSTER_GAME.md](archive/IMPOSTER_GAME.md) - Original Imposter spec

---

**Documentation last updated:** 2025-11-25
```

### 2. Update prd.md

Add deprecation notice at the top:

```markdown
> **⚠️ Historical Document**
>
> This PRD represents the original product vision from initial development.
> Many features described here are now implemented, while others remain future work.
>
> **For current implementation, see:**
> - Game flows: [GAME_FLOWS.md](GAME_FLOWS.md)
> - System architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
> - API documentation: [API_REFERENCE.md](API_REFERENCE.md)
>
> **This document is preserved for:**
> - Future feature planning
> - Product vision reference
> - Understanding original design intent
```

Update Section 3 (MVP SCOPE) to note what's actually implemented:

```markdown
# 3. MVP SCOPE (✅ IMPLEMENTED + EXTENDED)

**Note:** The MVP described below has been fully implemented, with additional
features added (voting/reveal phases, Imposter game). See GAME_FLOWS.md for
current game phases.

### ✅ Implemented in Current Version:
- Create room ✅
- Join room ✅
- Lobby with live player list ✅
- Assignment system ✅
- Wheel spin ✅
- Hotseat ✅
- **Voting phase** ✅ (added post-MVP)
- **Reveal phase** ✅ (added post-MVP)
- Scoreboard ✅
- **Imposter game** ✅ (entire second game added)

### 🚧 Not Yet Implemented (Future Features):
- Question submission round
- Question packs (Gaming, Fashion, Food, etc.)
- Custom questions toggle
- Avatars
- Timers
- Kick feature
- Multi-hotseat final round
```

### 3. Archive Old Docs

```bash
# Create archive directory
mkdir docs/archive

# Move outdated docs
mv docs/project_plan.md docs/archive/
mv docs/IMPOSTER_GAME.md docs/archive/

# Add README to archive
cat > docs/archive/README.md << 'EOF'
# Archived Documentation

This folder contains historical documentation from the initial development phase.
These documents are preserved for reference but are no longer accurate or complete.

**For current documentation, see the parent directory.**

## Contents

- **project_plan.md** - Original Assumptions MVP specification (superseded by ARCHITECTURE.md)
- **IMPOSTER_GAME.md** - Original Imposter game spec (superseded by GAME_FLOWS.md)

These documents may differ from the current implementation. Use with caution.

---
**Archived:** 2025-11-25
EOF
```

---

## Impact Assessment

### Before Archive:

```
docs/
├── API_REFERENCE.md       (new, accurate)
├── ARCHITECTURE.md        (new, accurate)
├── DEVELOPMENT.md         (new, accurate)
├── GAME_FLOWS.md          (new, accurate)
├── IMPOSTER_GAME.md       (outdated, contradicts implementation) ❌
├── prd.md                 (partially outdated, future vision) ⚠️
└── project_plan.md        (outdated, references completed work) ❌
```

**Problems:**
- 2 of 7 docs are outdated and contradict reality
- No clear entry point for new developers
- Duplicate information between old and new docs
- Risk of following outdated specifications

### After Archive:

```
docs/
├── README.md              (index, entry point) ✅
├── API_REFERENCE.md       (current) ✅
├── ARCHITECTURE.md        (current) ✅
├── DEVELOPMENT.md         (current) ✅
├── GAME_FLOWS.md          (current) ✅
├── prd.md                 (preserved with warnings) ⚠️
└── archive/
    ├── README.md          (explains archive) ✅
    ├── project_plan.md    (historical) 📦
    └── IMPOSTER_GAME.md   (historical) 📦
```

**Benefits:**
- Clear documentation entry point (README.md)
- Only current, accurate docs in main folder
- Historical context preserved but clearly marked
- No contradictions between specs and implementation
- Future developers won't accidentally follow outdated specs

---

## Redundancy Analysis

### Content Overlap

| Topic | project_plan.md | IMPOSTER_GAME.md | prd.md | New Docs |
|-------|----------------|------------------|--------|----------|
| Architecture | Partial | No | Partial | **ARCHITECTURE.md** (complete) |
| State Machine | Outdated | Outdated | Partial | **GAME_FLOWS.md** (complete, accurate) |
| API Endpoints | Listed | Listed | No | **API_REFERENCE.md** (complete with examples) |
| Database Schema | Incomplete | Partial | Partial | **ARCHITECTURE.md** (complete with constraints) |
| Development Setup | No | No | No | **DEVELOPMENT.md** (complete) |
| Future Features | No | Partial | **Extensive** | Not covered (intentionally) |

**Conclusion:** New docs cover all technical content comprehensively. Only PRD's future features section adds unique value.

---

## Recommendations Summary

### Immediate Actions (Priority 1)

1. ✅ **Create docs/README.md** - Entry point for documentation
2. ✅ **Update prd.md** - Add deprecation notice and update MVP section
3. ✅ **Create docs/archive/** - Archive directory with README
4. ✅ **Move outdated docs** - project_plan.md and IMPOSTER_GAME.md to archive/

### Optional (Priority 2)

5. ⚠️ **Review PRD future features** - Decide which features to pursue, update or remove outdated ideas
6. ⚠️ **Add CHANGELOG.md** - Track major changes to implementation
7. ⚠️ **Add CONTRIBUTING.md** - Guide for external contributors

---

## Conclusion

The new documentation (ARCHITECTURE.md, API_REFERENCE.md, GAME_FLOWS.md, DEVELOPMENT.md) is comprehensive, accurate, and well-organized. The legacy docs (project_plan.md, IMPOSTER_GAME.md) are outdated and contradictory to the actual implementation, but contain useful historical context.

**Recommended approach:**
- **Archive outdated specs** (they served their purpose during initial build)
- **Keep PRD** (future features are valuable for product planning)
- **Add documentation index** (README.md in docs/)
- **Mark PRD as historical** (so developers don't confuse vision with reality)

This creates a clean, authoritative documentation set where current information is easy to find and historical context is preserved for reference.

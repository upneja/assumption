# Documentation Index

Welcome to the **pregame.lol** documentation! This guide will help you navigate all available documentation and find what you need quickly.

---

## 📖 Current Documentation

**Start here for understanding the system:**

### Core Technical Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Complete system architecture
  - Technology stack and patterns
  - Database schema with ERDs
  - Data flow and state management
  - Realtime synchronization
  - Security model
  - Performance considerations
  - Troubleshooting guide

- **[API_REFERENCE.md](API_REFERENCE.md)** - Complete API documentation
  - All 13 endpoints (7 Assumptions + 6 Imposter)
  - Request/response formats
  - Authentication patterns
  - Error handling
  - Testing examples with curl

- **[GAME_FLOWS.md](GAME_FLOWS.md)** - Game state machines and gameplay
  - Visual state machine diagrams
  - Detailed phase descriptions for both games
  - Scoring systems explained
  - Example game walkthroughs
  - Debugging state issues

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Setup and development guide
  - Prerequisites and installation
  - Development workflow
  - Testing guide (unit, E2E)
  - Common tasks and patterns
  - Debugging techniques
  - Deployment instructions

### Quick Reference

| I want to... | Read this... |
|--------------|--------------|
| Set up the project for the first time | [DEVELOPMENT.md](DEVELOPMENT.md#initial-setup) |
| Understand how the database works | [ARCHITECTURE.md](ARCHITECTURE.md#database-schema) |
| Add a new API endpoint | [API_REFERENCE.md](API_REFERENCE.md#common-patterns) + [DEVELOPMENT.md](DEVELOPMENT.md#adding-a-new-api-route) |
| Understand game phases | [GAME_FLOWS.md](GAME_FLOWS.md) |
| Debug a game state issue | [GAME_FLOWS.md](GAME_FLOWS.md#debugging-state-issues) |
| Deploy to production | [DEVELOPMENT.md](DEVELOPMENT.md#deployment) |
| Understand security model | [ARCHITECTURE.md](ARCHITECTURE.md#security-model) |
| See all available endpoints | [API_REFERENCE.md](API_REFERENCE.md) |

---

## 🎯 Product Planning

- **[prd.md](prd.md)** - Product requirements and future vision
  - ⚠️ **Note:** Historical document - see deprecation notice at top
  - Contains original product vision
  - Extensive future feature ideas
  - Useful for planning future work

---

## 📦 Historical Documents

Archived specifications from initial development. These docs are **preserved for reference only** and may not reflect current implementation.

- **[archive/](archive/)** - Archived documentation
  - [project_plan.md](archive/project_plan.md) - Original Assumptions MVP specification
  - [IMPOSTER_GAME.md](archive/IMPOSTER_GAME.md) - Original Imposter game spec
  - See [archive/README.md](archive/README.md) for details

**⚠️ Warning:** Archived docs may contradict current implementation. Always refer to current docs above for accurate information.

---

## 🔍 Documentation Coverage

### What's Documented

✅ **Architecture & Design**
- Complete system architecture
- Database schema with all tables
- State machines for both games
- Security model and patterns

✅ **Development**
- Full setup guide
- Testing strategy
- Debugging techniques
- Deployment process

✅ **API**
- All 13 endpoints
- Request/response formats
- Authentication patterns
- Error handling

✅ **Code**
- Foundational files fully commented
- Game engine logic documented
- Type definitions explained
- Realtime system documented

### What's Not (Yet) Documented

- Individual React component API docs
- Detailed animation system
- UI/UX design system
- Performance benchmarks

---

## 📝 Documentation Standards

### Keeping Docs Up to Date

When making changes to the codebase:

1. **Code changes** → Update inline comments if logic changes
2. **New endpoints** → Add to API_REFERENCE.md
3. **New game phases** → Update GAME_FLOWS.md
4. **Database schema** → Update ARCHITECTURE.md
5. **New features** → Update README.md in root

### Documentation Style

- Use **present tense** ("The system does..." not "The system will...")
- Include **examples** where helpful
- Add **diagrams** for complex flows
- Link to related docs with **relative paths**
- Keep **code comments** in sync with implementation

---

## 🆘 Getting Help

### Issues & Questions

1. **Check docs first** - Use the quick reference table above
2. **Search docs** - Use Cmd+F / Ctrl+F in documentation files
3. **Check code comments** - Foundational files have detailed inline docs
4. **Open an issue** - If something's unclear or incorrect

### Contributing to Docs

Found an error or want to improve documentation?

1. Edit the relevant .md file
2. Follow the documentation standards above
3. Submit a PR with clear description
4. Tag with `documentation` label

---

## 📊 Documentation Stats

- **Total documentation files:** 8 (4 current + 1 planning + 3 archived)
- **Lines of documentation:** ~4,000+
- **Code files with detailed comments:** 7
- **Last major update:** 2025-11-25

---

## 🗺️ Documentation Map

```
docs/
├── README.md (you are here)
│
├── Current Documentation
│   ├── ARCHITECTURE.md        System design & database
│   ├── API_REFERENCE.md       All endpoints
│   ├── GAME_FLOWS.md          Game state machines
│   └── DEVELOPMENT.md         Setup & workflow
│
├── Product Planning
│   └── prd.md                 Product vision (historical)
│
└── Archive
    ├── README.md              Archive explanation
    ├── project_plan.md        Original MVP spec
    └── IMPOSTER_GAME.md       Original Imposter spec
```

---

**Happy coding! 🎉**

For questions or suggestions about documentation, please open an issue or reach out to the maintainers.

---

*Documentation last updated: 2025-11-25*

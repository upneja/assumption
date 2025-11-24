# pregame.lol

**Mobile-first party games for in-person play**

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-green)](https://supabase.com/)

One person hosts on a large screen, everyone else joins on their phones with a short code. No accounts, no installation—just instant multiplayer fun. Real-time synchronization keeps everyone in sync through Supabase Realtime.

## 🎮 Games

### Assumptions
Players answer questions as if they were someone else in the room while everyone tries to guess their secret assignment. A game of deduction, performance, and knowing your friends.

**Players:** 3-20
**Duration:** 15-30 minutes
**Phases:** Lobby → Assignment → Intro → Wheel → Hotseat → Voting → Reveal → Scoreboard

### Guess the Imposter
Classic social deduction. Civilians know the secret word, imposters don't. Give clues, spot the fake, vote to eliminate. Can you find the imposters before they reach parity?

**Players:** 3-20
**Duration:** 10-20 minutes
**Imposters:** 1 (3-7 players) or 2 (8+ players)
**Phases:** Lobby → Secret Reveal → Voting → Reveal

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- npm
- [Supabase account](https://supabase.com) (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/assumption.git
cd assumption/web

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Set up the database
# Copy contents of web/supabase/schema.sql
# Paste and run in Supabase SQL Editor

# Start development server
npm run dev
```

Open http://localhost:3000 and start playing!

## 📚 Documentation

Comprehensive guides for developers and contributors:

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design, data flow, database schema, security model
- **[API_REFERENCE.md](docs/API_REFERENCE.md)** - Complete API documentation for all 13 endpoints
- **[GAME_FLOWS.md](docs/GAME_FLOWS.md)** - Detailed state machines and gameplay flows for both games
- **[DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Setup guide, development workflow, testing, deployment
- **[PRD.md](docs/prd.md)** - Product requirements and feature roadmap
- **[IMPOSTER_GAME.md](docs/IMPOSTER_GAME.md)** - Imposter game specifications

## 🏗️ Architecture

### Technology Stack
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind 4
- **Backend:** Next.js API Routes, Supabase (PostgreSQL + Realtime)
- **Testing:** Vitest, Testing Library, Playwright
- **Deployment:** Vercel

### Key Features
- **No authentication required** - Players identified by session ID in localStorage
- **Real-time synchronization** - Supabase Realtime keeps all clients in sync
- **Host-controlled flow** - One player has authority to advance game phases
- **State machine validation** - Server-side validation prevents invalid transitions
- **Mobile-first design** - Optimized for phones, responsive for larger screens

### Project Structure
```
web/
├── src/
│   ├── app/              # Pages & API routes
│   ├── components/       # React components (phase views)
│   ├── lib/              # Business logic & utilities
│   └── types/            # TypeScript definitions
├── supabase/
│   └── schema.sql        # Database schema
├── public/               # Static assets
└── docs/                 # Documentation
```

### Data Flow
1. Client action (e.g., host clicks "Start Game")
2. HTTP request to API route with session ID
3. Server validates request & updates database
4. Server broadcasts update via Supabase Realtime
5. All subscribed clients receive broadcast
6. Clients update local React state
7. UI re-renders

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed system design.

## 🧪 Development

### Running the App
```bash
cd web
npm run dev          # Start development server (localhost:3000)
npm run build        # Create production build
npm run start        # Run production build locally
```

### Testing
```bash
npm run lint                # Check code style
npm run test                # Run unit tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Generate coverage report
npx playwright test         # Run E2E tests
npx playwright test --ui    # Run E2E tests in UI mode
```

### Key Commands
```bash
npm run type-check  # TypeScript type checking
npm run lint:fix    # Auto-fix linting issues
```

See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for complete development guide.

## 🔌 API Endpoints

### Assumptions Game
- `POST /api/rooms` - Create room
- `POST /api/rooms/[code]/join` - Join room
- `GET /api/rooms/[code]` - Get room state
- `POST /api/rooms/[code]/start` - Start game (host only)
- `POST /api/rooms/[code]/spin` - Spin wheel (host only)
- `POST /api/rooms/[code]/vote` - Submit vote
- `POST /api/rooms/[code]/next` - Advance phase (host only)

### Imposter Game
- `POST /api/imposter/rooms` - Create room
- `POST /api/imposter/rooms/[code]/join` - Join room
- `GET /api/imposter/rooms/[code]` - Get room state
- `POST /api/imposter/rooms/[code]/start` - Start round with topic (host only)
- `POST /api/imposter/rooms/[code]/advance` - Advance phase (host only)
- `POST /api/imposter/rooms/[code]/vote` - Vote for suspected imposter

All routes:
- Require session ID in request body for authentication
- Validate host status for privileged operations
- Broadcast updates via Supabase Realtime
- Return consistent error formats

See [API_REFERENCE.md](docs/API_REFERENCE.md) for complete API documentation.

## 🎯 Game Flows

### Assumptions State Machine
```
LOBBY → ASSIGNMENT → INTRO → WHEEL → HOTSEAT → VOTING → REVEAL → SCOREBOARD → COMPLETE
                               ↑___________________________________|
```

### Imposter State Machine
```
LOBBY → SECRET_REVEAL → VOTING → REVEAL (→ GAME_OVER or loop back)
          ↑_________________________|
```

See [GAME_FLOWS.md](docs/GAME_FLOWS.md) for detailed phase descriptions and gameplay.

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push to main

### Environment Variables
```env
# Required for deployment
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Security:** Never commit `.env.local` or expose service role keys to the client.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write/update tests
5. Run checks (`npm run lint`, `npm run test`, `npm run build`)
6. Commit changes (`git commit -m 'Add amazing feature'`)
7. Push to branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📝 License

This project is open source and available under the MIT License.

## 🐛 Issues & Feedback

Found a bug or have a suggestion? [Open an issue](https://github.com/yourusername/assumption/issues)

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Vercel](https://vercel.com/) - Hosting

---

**Made for fun, friends, and party vibes** 🎉

# Development Guide

**pregame.lol** - Setup, Workflow, and Best Practices

Last updated: 2025-11-25

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Development Workflow](#development-workflow)
4. [Testing](#testing)
5. [Code Organization](#code-organization)
6. [Common Tasks](#common-tasks)
7. [Debugging](#debugging)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: 18.x or higher
  ```bash
  node --version  # Should show v18.x.x or higher
  ```

- **npm**: 9.x or higher (comes with Node.js)
  ```bash
  npm --version
  ```

- **Git**: For version control
  ```bash
  git --version
  ```

### Required Accounts

- **Supabase Account**: Free tier is sufficient
  - Sign up at [supabase.com](https://supabase.com)
  - Create a new project
  - Note your project URL and API keys

- **Vercel Account** (for deployment): Optional for local development
  - Sign up at [vercel.com](https://vercel.com)
  - Connect your GitHub repository

### Recommended Tools

- **VS Code**: With these extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript + JavaScript
- **Browser DevTools**: Chrome or Firefox recommended
- **Supabase CLI** (optional): For advanced database management

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/assumption.git
cd assumption
```

### 2. Install Dependencies

```bash
cd web
npm install
```

This installs:
- Next.js 16
- React 19
- Supabase client
- Tailwind 4
- TypeScript
- Testing libraries (Vitest, Testing Library, Playwright)

### 3. Configure Environment Variables

Create `web/.env.local`:

```bash
# Copy the example
cp .env.example .env.local

# Edit with your values
nano .env.local
```

Required variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Public Supabase Configuration (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these:**
1. Go to your Supabase project dashboard
2. Click "Settings" → "API"
3. Copy:
   - Project URL → `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

**Security Note:** Never commit `.env.local` to Git. It's in `.gitignore` by default.

### 4. Set Up the Database

#### Option A: Using Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Go to "SQL Editor"
3. Create a new query
4. Copy the entire contents of `web/supabase/schema.sql`
5. Paste and run the query

This creates:
- All tables (rooms, players, assignments, votes, imposter tables)
- Indexes for performance
- RLS policies for security
- Realtime publication for live updates

#### Option B: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 5. Verify Setup

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser. You should see:
- Home page with game selection
- "Host a Game" and "Join Game" buttons
- No errors in browser console

Test the connection:
1. Click "Host a Game"
2. Enter your name
3. Select "Assumptions"
4. Click "Host"

If you see a room code, setup is complete! 🎉

---

## Development Workflow

### Starting Development

```bash
cd web
npm run dev
```

The server starts on `http://localhost:3000` with:
- Hot Module Replacement (HMR) for instant updates
- TypeScript compilation
- Tailwind CSS processing

### File Watching

Next.js automatically watches:
- `src/app/**` - Pages and API routes
- `src/components/**` - React components
- `src/lib/**` - Utility functions
- `tailwind.config.ts` - Tailwind configuration

Changes trigger automatic recompilation and browser refresh.

### Making Changes

#### 1. Feature Development Workflow

```bash
# 1. Create a feature branch
git checkout -b feature/your-feature-name

# 2. Make changes
# - Edit files in src/
# - Test in browser
# - Write unit tests

# 3. Run checks
npm run lint          # Check code style
npm run test          # Run unit tests
npm run build         # Test production build

# 4. Commit changes
git add .
git commit -m "Add feature: description"

# 5. Push and create PR
git push origin feature/your-feature-name
```

#### 2. Adding a New API Route

Example: Add a "kick player" endpoint

```bash
# Create the route file
touch src/app/api/rooms/[code]/kick/route.ts
```

```typescript
// src/app/api/rooms/[code]/kick/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { sessionId, playerIdToKick } = await request.json();
    const { code } = params;

    // 1. Validate host
    const { data: host } = await supabaseAdmin
      .from('players')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_host', true)
      .single();

    if (!host) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Delete player
    await supabaseAdmin
      .from('players')
      .delete()
      .eq('id', playerIdToKick);

    // 3. Broadcast update
    // (Implementation details...)

    return Response.json({ success: true });
  } catch (error) {
    console.error('Kick player error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

Test the endpoint:
```bash
curl -X POST http://localhost:3000/api/rooms/ABC123/kick \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"your-session-id","playerIdToKick":"player-uuid"}'
```

#### 3. Adding a New Component

Example: Add a "Timer" component

```bash
# Create component file
touch src/components/Timer.tsx
```

```typescript
// src/components/Timer.tsx
'use client';

import { useState, useEffect } from 'react';

interface TimerProps {
  seconds: number;
  onComplete?: () => void;
}

export default function Timer({ seconds, onComplete }: TimerProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining === 0) {
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setRemaining(remaining - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [remaining, onComplete]);

  return (
    <div className="text-4xl font-bold">
      {remaining}s
    </div>
  );
}
```

Use in a page:
```typescript
import Timer from '@/components/Timer';

<Timer seconds={60} onComplete={() => alert('Time up!')} />
```

#### 4. Modifying State Machine

When adding new game phases:

1. **Update types** (`src/types/index.ts`):
   ```typescript
   export type GamePhase =
     | 'LOBBY'
     | 'NEW_PHASE'  // Add here
     | ...
   ```

2. **Update state machine** (`src/lib/gameEngine.ts`):
   ```typescript
   const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
     LOBBY: ['ASSIGNMENT'],
     ASSIGNMENT: ['NEW_PHASE'],  // Add transition
     NEW_PHASE: ['INTRO'],        // Add new phase
     ...
   };
   ```

3. **Add component** (`src/components/NewPhaseView.tsx`)

4. **Update room page** (`src/app/room/[code]/page.tsx`):
   ```typescript
   if (room.state === 'NEW_PHASE') {
     return <NewPhaseView {...props} />;
   }
   ```

5. **Add API endpoint** for phase-specific actions

6. **Update tests** for new transitions

---

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test src/lib/gameEngine.test.ts
```

### Test Structure

Tests are colocated with source files:

```
src/
├── lib/
│   ├── gameEngine.ts
│   └── gameEngine.test.ts      ← Test file
├── components/
│   ├── LobbyView.tsx
│   └── LobbyView.test.tsx      ← Test file
```

### Writing Tests

#### Unit Test Example (Pure Logic)

```typescript
// src/lib/gameEngine.test.ts
import { describe, it, expect } from 'vitest';
import { isValidTransition, selectHotseat } from './gameEngine';

describe('gameEngine', () => {
  describe('isValidTransition', () => {
    it('allows LOBBY to ASSIGNMENT', () => {
      expect(isValidTransition('LOBBY', 'ASSIGNMENT')).toBe(true);
    });

    it('blocks LOBBY to WHEEL', () => {
      expect(isValidTransition('LOBBY', 'WHEEL')).toBe(false);
    });
  });

  describe('selectHotseat', () => {
    it('selects from eligible players', () => {
      const players = [
        { id: '1', display_name: 'Alice' },
        { id: '2', display_name: 'Bob' },
        { id: '3', display_name: 'Charlie' },
      ];
      const history = ['1']; // Alice already went

      const selected = selectHotseat(players, history);
      expect(['2', '3']).toContain(selected);
      expect(selected).not.toBe('1');
    });
  });
});
```

#### Component Test Example

```typescript
// src/components/LobbyView.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LobbyView from './LobbyView';

describe('LobbyView', () => {
  it('renders player list', () => {
    const players = [
      { id: '1', display_name: 'Alice', is_host: true },
      { id: '2', display_name: 'Bob', is_host: false },
    ];

    render(<LobbyView players={players} currentPlayer={players[0]} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows start button for host', () => {
    const players = [
      { id: '1', display_name: 'Alice', is_host: true },
    ];

    render(
      <LobbyView
        players={players}
        currentPlayer={players[0]}
        isHost={true}
        onStartGame={vi.fn()}
      />
    );

    expect(screen.getByText('Start Game')).toBeInTheDocument();
  });

  it('calls onStartGame when clicked', async () => {
    const onStartGame = vi.fn();
    const players = [
      { id: '1', display_name: 'Alice', is_host: true },
      { id: '2', display_name: 'Bob', is_host: false },
      { id: '3', display_name: 'Charlie', is_host: false },
    ];

    render(
      <LobbyView
        players={players}
        currentPlayer={players[0]}
        isHost={true}
        onStartGame={onStartGame}
        isLoading={false}
      />
    );

    const button = screen.getByText('Start Game');
    await userEvent.click(button);

    expect(onStartGame).toHaveBeenCalledOnce();
  });
});
```

#### API Route Test Example (with MSW)

```typescript
// src/app/api/rooms/route.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.post('/api/rooms', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      room: { code: 'TEST123', state: 'LOBBY' },
      player: { id: '1', display_name: body.displayName },
    });
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('POST /api/rooms', () => {
  it('creates a room', async () => {
    const response = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: 'Alice',
        sessionId: 'test-uuid',
      }),
    });

    const data = await response.json();
    expect(data.room.code).toBe('TEST123');
    expect(data.player.display_name).toBe('Alice');
  });
});
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
npx playwright test

# Run in UI mode
npx playwright test --ui

# Run specific test
npx playwright test tests/game-flow.spec.ts
```

Example E2E test:
```typescript
// tests/game-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete game flow', async ({ page }) => {
  // Host creates room
  await page.goto('http://localhost:3000');
  await page.fill('input[name="displayName"]', 'Alice');
  await page.click('button:has-text("Host")');

  // Should see room code
  await expect(page.locator('text=/[A-Z]{6}/')).toBeVisible();

  // ... more test steps
});
```

---

## Code Organization

### Project Structure

```
web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Home page
│   │   ├── layout.tsx          # Root layout
│   │   ├── room/[code]/        # Assumptions game
│   │   ├── imposter/room/[code]/ # Imposter game
│   │   └── api/                # API routes
│   │       ├── rooms/          # Assumptions endpoints
│   │       └── imposter/rooms/ # Imposter endpoints
│   │
│   ├── components/             # React components
│   │   ├── LobbyView.tsx       # Reusable views
│   │   ├── WheelView.tsx
│   │   └── ...
│   │
│   ├── lib/                    # Business logic
│   │   ├── session.ts          # Session management
│   │   ├── supabaseClient.ts   # Browser client
│   │   ├── supabaseServer.ts   # Server client
│   │   ├── realtime.ts         # Subscriptions
│   │   ├── gameEngine.ts       # State machine
│   │   ├── roomService.ts      # Assumptions logic
│   │   └── imposterService.ts  # Imposter logic
│   │
│   └── types/
│       └── index.ts            # TypeScript types
│
├── public/                     # Static assets
├── supabase/
│   └── schema.sql              # Database schema
│
├── package.json                # Dependencies
├── next.config.ts              # Next.js config
├── tailwind.config.ts          # Tailwind config
├── tsconfig.json               # TypeScript config
└── vitest.config.ts            # Test config
```

### Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
  - `LobbyView.tsx` (component)
  - `gameEngine.ts` (utility)

- **Components**: PascalCase, default export
  ```typescript
  export default function LobbyView() { ... }
  ```

- **Functions**: camelCase
  ```typescript
  export function createRoom() { ... }
  ```

- **Types/Interfaces**: PascalCase
  ```typescript
  export interface Player { ... }
  export type GamePhase = ...
  ```

- **Constants**: UPPER_SNAKE_CASE
  ```typescript
  const SESSION_KEY = 'assumptions_session_id';
  ```

### Import Organization

Order imports by type:

```typescript
// 1. External packages
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 2. Internal modules
import { getSessionId } from '@/lib/session';
import { supabase } from '@/lib/supabaseClient';

// 3. Types
import type { Player, Room } from '@/types';

// 4. Components
import LobbyView from '@/components/LobbyView';
```

---

## Common Tasks

### Adding a New Game Mode

1. **Add game type** to types:
   ```typescript
   export type GameType = 'ASSUMPTIONS' | 'IMPOSTER' | 'NEW_GAME';
   ```

2. **Create state machine** in `gameEngine.ts`

3. **Add room creation logic** in `POST /api/rooms`

4. **Create game page** at `app/new-game/room/[code]/page.tsx`

5. **Add API endpoints** under `api/new-game/rooms/`

6. **Update home page** to include new game option

### Modifying the Database Schema

1. **Edit** `supabase/schema.sql`

2. **Run migration** in Supabase dashboard SQL editor

3. **Update TypeScript types** in `src/types/index.ts`

4. **Update services** that interact with changed tables

5. **Test locally** with new schema

### Adding a Realtime Event

1. **Define event type** in `types/index.ts`:
   ```typescript
   export type RealtimeEventType =
     | 'room_updated'
     | 'new_event';  // Add here
   ```

2. **Update broadcast** in API route:
   ```typescript
   await supabase.channel(`room:${code}`).send({
     type: 'broadcast',
     event: 'new_event',
     payload: { data },
   });
   ```

3. **Add listener** in `realtime.ts`:
   ```typescript
   .on('broadcast', { event: 'new_event' }, ({ payload }) => {
     callbacks.onNewEvent?.(payload.data);
   })
   ```

4. **Use in component**:
   ```typescript
   subscribeToRoom(code, {
     onNewEvent: (data) => setData(data),
   });
   ```

### Updating Tailwind Styles

Global styles are in `src/app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-neon-green: #39FF14;
  --font-family-geist: "Geist", sans-serif;
}
```

Use in components:
```tsx
<div className="bg-[var(--color-neon-green)]">
  Neon text
</div>
```

---

## Debugging

### Browser DevTools

**Console Tab:**
- Check for JavaScript errors
- View `console.log()` output
- Inspect network requests

**Network Tab:**
- Monitor API calls
- Check request/response payloads
- Verify Supabase Realtime connection (WebSocket)

**Application Tab:**
- Inspect localStorage (session ID)
- View cookies (if any)
- Check IndexedDB (Supabase cache)

**React DevTools:**
- Inspect component tree
- View component state/props
- Track re-renders

### Server Logs

View API route logs in terminal where `npm run dev` is running:

```bash
# Example output
POST /api/rooms/ABC123/start 200 in 156ms
Realtime broadcast sent: room_updated
```

Add debug logging:
```typescript
console.log('Debug:', { room, players, assignments });
console.error('Error in start game:', error);
```

### Supabase Dashboard

**Database Tab:**
- Query tables directly
- View current data
- Check RLS policies

**API Tab:**
- Test endpoints with built-in REST client
- View API logs
- Check auth status

**Realtime Tab:**
- Monitor active connections
- View broadcast messages
- Debug subscription issues

### Common Debugging Commands

```bash
# Check localStorage in browser console
localStorage.getItem('assumptions_session_id')

# Clear localStorage
localStorage.clear()

# Test API endpoint
curl http://localhost:3000/api/rooms/ABC123

# Check if Supabase is reachable
curl https://your-project.supabase.co/rest/v1/
```

---

## Deployment

### Deploying to Vercel

1. **Push to GitHub**:
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel auto-detects Next.js

3. **Configure Environment Variables**:
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add all variables from `.env.local`
   - Make sure to add to "Production" environment

4. **Deploy**:
   - Vercel automatically deploys on every push to `main`
   - Or click "Deploy" manually in dashboard

5. **Custom Domain** (optional):
   - Go to Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

### Environment-Specific Configuration

**Development** (`.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
```

**Production** (Vercel):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

### Build Checks

Before deploying, run:

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build

# Test
npm run test
```

All should pass without errors.

---

## Troubleshooting

### "Module not found" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Supabase connection failures

1. Check environment variables are set correctly
2. Verify Supabase project is active (not paused)
3. Check network connection
4. Test API key in Supabase dashboard

### Realtime not working

1. Verify realtime is enabled in Supabase dashboard
2. Check tables are added to `supabase_realtime` publication
3. Inspect WebSocket connection in Network tab (should see `wss://`)
4. Check subscription callbacks are defined correctly

### TypeScript errors

```bash
# Restart TypeScript server in VS Code
# Press Cmd+Shift+P → "TypeScript: Restart TS Server"

# Or rebuild types
npm run build
```

### Port already in use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Hot reload not working

1. Check file watchers limit (Mac/Linux):
   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. Restart dev server:
   ```bash
   # Ctrl+C to stop
   npm run dev
   ```

---

## Additional Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Vitest**: https://vitest.dev
- **TypeScript**: https://www.typescriptlang.org/docs

---

**Document Version:** 1.0
**Last Updated:** 2025-11-25

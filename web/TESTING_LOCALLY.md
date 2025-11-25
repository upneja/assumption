# Testing Capacitor Setup Locally

## Why You Need to Test Before Prod

The mobile app needs to call your API, so you have 3 options:

1. ✅ **Test web build** (make sure nothing broke)
2. ✅ **Use ngrok for mobile testing** (quick, free)
3. ✅ **Deploy to Vercel preview** (most production-like)

## Step 1: Test Web Build Still Works

First, make sure the web version still works normally:

```bash
# Start dev server
npm run dev

# Open browser to http://localhost:3000
# Test:
# - Create a room
# - Join from another browser tab
# - Play through a full game
# - Check console for errors
```

**What to verify:**
- [ ] Home page loads
- [ ] Can create room (host)
- [ ] Can join room with code
- [ ] Realtime updates work (lobby, game states)
- [ ] Game completes end-to-end
- [ ] No console errors

---

## Step 2: Test Mobile App Locally with ngrok

**Option A: Use ngrok (Recommended for quick testing)**

### Install ngrok
```bash
# Install via Homebrew
brew install ngrok

# Or download from https://ngrok.com/download
```

### Start your dev server + ngrok
```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Expose it via ngrok
ngrok http 3000
```

You'll see output like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

### Configure mobile app to use ngrok URL

Update `.env.local`:
```bash
NEXT_PUBLIC_API_URL=https://abc123.ngrok-free.app
```

**Important**: Each time you restart ngrok, the URL changes. Update `.env.local` each time.

### Build and test on iOS
```bash
# Rebuild with ngrok URL
npm run cap:sync

# Open in Xcode
npm run cap:open:ios

# Connect iPhone or use Simulator
# Click Run (▶️)
```

### Test cross-platform lobby
1. **Mobile**: Create a room
2. **Web**: Open `https://abc123.ngrok-free.app` in browser
3. **Web**: Join the room using the code from mobile
4. **Verify**: Both devices see each other in lobby
5. **Play**: Complete a game end-to-end

**What to test:**
- [ ] Mobile app loads without errors
- [ ] Can create room on mobile
- [ ] Can join from web browser using ngrok URL
- [ ] Lobby shows all players (mobile + web)
- [ ] Realtime updates work (game state changes)
- [ ] Haptic feedback works on mobile
- [ ] Game completes successfully
- [ ] No API errors in Xcode console

### Debugging in Xcode

Watch the console for errors:
```
Xcode → Show Debug Area (Cmd+Shift+Y)

Look for:
- API call errors (404, 500)
- WebSocket connection issues
- CORS errors (shouldn't happen with ngrok)
```

Common ngrok issues:
- **"Invalid Host header"**: Next.js blocks ngrok by default
  - Add to `next.config.ts`:
    ```typescript
    const nextConfig: NextConfig = {
      // ...existing config
      async headers() {
        return [{
          source: '/:path*',
          headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
        }];
      },
    };
    ```

---

## Step 3: Test with Vercel Preview (Most Production-Like)

This is the safest way to test before going to prod.

### Create a preview deployment

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login
vercel login

# Deploy to preview (not production)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Scope: Your account
# - Link to existing project? No (first time)
# - Project name: pregame-web
# - Directory: ./
# - Override settings? No
```

Vercel will give you a preview URL like:
```
https://pregame-web-abc123.vercel.app
```

### Update mobile app to use preview URL

```bash
# Update .env.local
NEXT_PUBLIC_API_URL=https://pregame-web-abc123.vercel.app

# Rebuild mobile
npm run cap:sync

# Test in Xcode
npm run cap:open:ios
```

### Test cross-platform

1. **Mobile**: Create room
2. **Web**: Open preview URL in browser
3. **Join**: Use room code to join
4. **Verify**: Cross-platform lobby works

**Advantages of Vercel preview:**
- ✅ Real HTTPS
- ✅ Persistent URL (doesn't change like ngrok)
- ✅ Production-like environment
- ✅ Can share with friends for testing
- ✅ Free on Vercel's hobby plan

---

## Step 4: When Everything Works - Push to Prod

### Deploy to production

```bash
# Deploy to production Vercel
vercel --prod

# You'll get your final URL:
# https://pregame.lol (if you configured custom domain)
# or
# https://pregame-web.vercel.app
```

### Update mobile with production URL

```bash
# Update .env.local with FINAL production URL
NEXT_PUBLIC_API_URL=https://pregame.lol

# Final mobile build
npm run cap:sync

# Test one more time in Xcode
npm run cap:open:ios
```

### Push to Git

```bash
git add .
git commit -m "Add Capacitor iOS support with haptics and safe areas"
git push origin main
```

---

## Quick Testing Checklist

Before pushing to production, verify:

### Web (localhost:3000)
- [ ] Home page loads
- [ ] Create room works
- [ ] Join room works
- [ ] Lobby displays players
- [ ] Game flow works (Assumptions)
- [ ] Game flow works (Imposter)
- [ ] No console errors

### Mobile + Web Cross-Platform (ngrok or Vercel preview)
- [ ] Mobile app loads
- [ ] Create room on mobile
- [ ] Join from web browser
- [ ] Both see each other in lobby
- [ ] Realtime updates (players joining, game state)
- [ ] Wheel spin animation
- [ ] Voting works
- [ ] Reveal shows correct answer
- [ ] Haptic feedback on mobile:
  - [ ] Vote selection (light tap)
  - [ ] Vote submission (medium tap)
  - [ ] Wheel spin start (medium tap)
  - [ ] Wheel reveal (heavy tap)
  - [ ] Game reveal (success/error)
- [ ] iOS safe areas (no content cut off)
- [ ] Game completes successfully

### Supabase Realtime
- [ ] WebSocket connects (check Xcode console)
- [ ] Room updates in realtime
- [ ] Player joins/leaves update immediately
- [ ] Game state changes propagate
- [ ] No WebSocket errors

---

## Troubleshooting

### API calls fail with 404

**Symptoms**: Mobile app shows "Failed to load room" or similar

**Check**:
1. Is dev server running? (`npm run dev`)
2. Is ngrok running? (`ngrok http 3000`)
3. Is `NEXT_PUBLIC_API_URL` set correctly in `.env.local`?
4. Did you rebuild? (`npm run cap:sync`)

**Fix**:
```bash
# Verify .env.local
cat .env.local

# Should show:
# NEXT_PUBLIC_API_URL=https://your-ngrok-url.ngrok-free.app

# Rebuild
npm run cap:sync
```

### WebSocket (Realtime) doesn't work

**Symptoms**: Players don't see updates, lobby doesn't refresh

**Check Xcode console** for:
```
WebSocket connection failed
Realtime subscription error
```

**Possible causes**:
1. Supabase URL/key not set in `.env.local`
2. WKWebView blocking WebSocket
3. Network configuration

**Test WebSocket separately**:
```javascript
// Add to a component temporarily
useEffect(() => {
  console.log('Testing Supabase connection...');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
}, []);
```

### Haptics don't work

**Note**: Haptics only work on **real devices**, not simulator.

**If on real device and still not working**:
1. Check Settings → Sounds & Haptics → System Haptics is ON
2. Verify `@capacitor/haptics` is installed
3. Check Xcode console for haptics errors

### "Invalid Host header" with ngrok

**Fix**: Update `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  // ... existing config

  // Allow ngrok hosts
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
      ],
    }];
  },
};
```

Restart dev server after changing config.

---

## Recommended Testing Flow

**Day 1: Local Web Testing**
```bash
npm run dev
# Test everything on localhost:3000
```

**Day 2: Mobile + ngrok**
```bash
# Terminal 1
npm run dev

# Terminal 2
ngrok http 3000

# Update .env.local with ngrok URL
# npm run cap:sync
# Test on iPhone
```

**Day 3: Vercel Preview**
```bash
vercel  # Deploy to preview
# Update .env.local with preview URL
# npm run cap:sync
# Test on iPhone
# Share preview URL with friends
```

**Day 4: Production**
```bash
vercel --prod
# Update .env.local with production URL
# npm run cap:sync
# Final test
# git push
```

---

## Next Steps After Local Testing

Once everything works locally:
1. [ ] Deploy to production Vercel
2. [ ] Update mobile app with prod URL
3. [ ] Create app icon (1024x1024)
4. [ ] Configure Xcode signing
5. [ ] Archive and upload to TestFlight

See `CAPACITOR_SETUP.md` for TestFlight instructions.

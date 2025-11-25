# Capacitor iOS Setup Complete - Next Steps

**Status**: ✅ Phase 1A & 1B Complete
**Date**: November 25, 2025

## What's Been Done

### Phase 1A: Capacitor Setup & Static Export ✅

1. **Installed Capacitor**
   - `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`
   - Created `capacitor.config.ts` with app ID `lol.pregame.app`
   - iOS project initialized in `/ios` directory

2. **Configured Next.js for Static Export**
   - Updated `next.config.ts` with conditional static export
   - Build target env variable: `BUILD_TARGET=capacitor`
   - Created custom build script: `build-mobile.sh`
   - **Important**: API routes are excluded from mobile build (see Architecture below)

3. **Handled Dynamic Routes**
   - Added route segment config for `/room/[code]` and `/imposter/room/[code]`
   - Client-side routing handles dynamic room codes
   - SSR-safe `getSessionId()` function (returns empty string during static generation)

4. **Build Scripts Added**
   - `npm run build:mobile` - Build static export for Capacitor
   - `npm run cap:sync` - Build + sync to iOS project
   - `npm run cap:open:ios` - Open Xcode project

### Phase 1B: Mobile Polish ✅

1. **iOS Safe Areas**
   - Added `viewport-fit=cover` for notched devices
   - Theme color and status bar configuration
   - PWA meta tags for iOS

2. **Haptic Feedback** (`@capacitor/haptics`)
   - ✅ **Vote selection**: Light haptic on player selection
   - ✅ **Vote submission**: Medium haptic on "Lock In Vote"
   - ✅ **Wheel spin start**: Medium haptic when spin begins
   - ✅ **Wheel reveal**: Heavy haptic when wheel lands
   - ✅ **Game reveal**: Success/Error haptic based on vote correctness
   - Utility functions in `/src/lib/haptics.ts`
   - Gracefully falls back on web (no-op)

3. **Environment Configuration**
   - Created `.env.example` with API URL documentation
   - `NEXT_PUBLIC_API_URL` for production API endpoint

## Architecture: How Mobile + Web Works Together

```
┌─────────────────────────────────────────────────────────┐
│                   PREGAME.LOL ARCHITECTURE              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  WEB BUILD (Vercel/Netlify)                            │
│  ├─ Next.js with API routes                            │
│  ├─ SSR + Client-side rendering                        │
│  └─ API: /api/rooms, /api/imposter, etc.               │
│                                                         │
│  MOBILE BUILD (Capacitor)                              │
│  ├─ Static HTML/JS/CSS (no API routes)                 │
│  ├─ All API calls point to hosted web app ───┐         │
│  └─ Client-side routing for dynamic codes     │         │
│                                                │         │
│  SHARED BACKEND                                │         │
│  └─ Supabase (Database + Realtime WebSocket) <─┘        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Key Points:
- **Web version**: Full Next.js app with API routes (deploy to Vercel/Netlify)
- **Mobile version**: Static shell that makes API calls to the hosted web app
- **Cross-platform lobbies**: Mobile and web users share the same Supabase database
- **Realtime**: WebSocket connections work from both platforms

## File Structure Changes

```
/Users/upneja/Projects/assumption/web/
├── capacitor.config.ts           # Capacitor configuration
├── build-mobile.sh                # Mobile build script
├── .env.example                   # Environment template
├── ios/                           # iOS native project (Xcode)
│   └── App/                       # Main iOS app
│       └── App/
│           └── public/            # Static assets (synced from /out)
├── src/
│   ├── lib/
│   │   ├── apiUrl.ts              # API URL helper (web vs mobile)
│   │   ├── haptics.ts             # Haptic feedback utilities
│   │   └── session.ts             # Updated: SSR-safe getSessionId
│   ├── app/
│   │   ├── layout.tsx             # Updated: iOS viewport config
│   │   ├── room/[code]/
│   │   │   └── layout.tsx         # Route segment config
│   │   └── imposter/room/[code]/
│   │       └── layout.tsx         # Route segment config
│   └── components/
│       ├── VotingView.tsx         # Added: Haptics on vote
│       ├── WheelView.tsx          # Added: Haptics on spin
│       └── RevealView.tsx         # Added: Haptics on reveal
└── out/                           # Static export output
```

## Next Steps

### Immediate: Set Up Xcode (Required for iOS Build)

1. **Install Xcode**
   ```bash
   # Download from App Store or:
   xcode-select --install
   ```

2. **Install CocoaPods**
   ```bash
   sudo gem install cocoapods
   cd ios/App
   pod install
   ```

3. **Open Xcode Project**
   ```bash
   npm run cap:open:ios
   # Or manually: open ios/App/App.xcworkspace
   ```

### Phase 1C: TestFlight Preparation

**Before you can test on a real device or upload to TestFlight:**

1. **Apple Developer Account** ($99/year)
   - Sign up at https://developer.apple.com
   - Required for TestFlight and App Store

2. **App Icon**
   - Create 1024×1024px icon (Canva or Figma)
   - Use https://appicon.co to generate all sizes
   - Add to `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

3. **Configure Signing in Xcode**
   - Open Xcode project
   - Select "App" target → Signing & Capabilities
   - Choose your team (Apple Developer account)
   - Xcode will auto-generate provisioning profiles

4. **Deploy Web App First** (Critical!)
   - Deploy to Vercel/Netlify: `vercel` or `netlify deploy`
   - Get production URL (e.g., `https://pregame.lol`)
   - Update `.env.local`:
     ```bash
     NEXT_PUBLIC_API_URL=https://pregame.lol
     ```
   - Rebuild mobile: `npm run cap:sync`

5. **Test on Real Device**
   - Connect iPhone via USB
   - Select device in Xcode
   - Click "Run" (▶️)
   - Test:
     - [ ] Create room on mobile
     - [ ] Join from web browser
     - [ ] Verify cross-platform lobby works
     - [ ] Test WebSocket (room updates in realtime)
     - [ ] Feel haptic feedback

6. **Build for TestFlight**
   - Xcode → Product → Archive
   - Distribute App → App Store Connect
   - Upload to TestFlight
   - Add beta testers (up to 10,000!)

### Testing Checklist (Before TestFlight)

- [ ] Mobile app loads without errors
- [ ] Can create room on mobile
- [ ] Can join room from web
- [ ] Room code displays correctly
- [ ] Realtime updates work (other players joining, game state changes)
- [ ] Haptic feedback works (vote, wheel, reveal)
- [ ] Game completes end-to-end
- [ ] No API errors in console
- [ ] Safe areas look correct (no content cut off on notched iPhones)

## Troubleshooting

### "API call failed" errors on mobile
- **Cause**: `NEXT_PUBLIC_API_URL` not set or web app not deployed
- **Fix**: Deploy web app first, then update `.env.local` and rebuild

### WebSocket connection fails
- **Cause**: Supabase Realtime might not work in WKWebView
- **Test**: Open mobile app and watch console in Xcode
- **Fix**: If it fails, may need to adjust Realtime connection settings

### "getSessionId can only be called on the client" error
- **Cause**: SSR trying to access localStorage (already fixed)
- **Verify**: `getSessionId` returns empty string when `window === undefined`

### Xcode build errors
- **"Pod install failed"**: Run `cd ios/App && pod install`
- **"Signing failed"**: Add Apple Developer account in Xcode preferences
- **"Build input file cannot be found"**: Clean build folder (Cmd+Shift+K)

## Useful Commands

```bash
# Development
npm run dev                    # Run Next.js dev server (web)

# Mobile builds
npm run build:mobile           # Build static export for Capacitor
npm run cap:sync               # Build + sync to iOS
npm run cap:open:ios           # Open Xcode

# Deployment
vercel                         # Deploy to Vercel (recommended)
# or
netlify deploy --prod          # Deploy to Netlify
```

## What's Next

According to `ProductStrategy.md`:

**This Week:**
- [ ] Get Apple Developer account ($99)
- [ ] Deploy web app to production
- [ ] Test on real iPhone (borrow if needed)
- [ ] Create app icon
- [ ] Upload to TestFlight

**Next Week (Phase 1D):**
- [ ] Invite 5 friends to beta test
- [ ] Host in-person game session
- [ ] Film reactions (TikTok content!)
- [ ] Fix critical bugs from feedback

**Goal:** Working iOS app on TestFlight with 5 beta testers playing

---

## Summary

✅ **Phases 1A & 1B are complete!**

You now have:
- A Capacitor-ready Next.js app with static export
- iOS project configured and synced
- Haptic feedback on key interactions
- iOS safe area handling
- Cross-platform lobby architecture

**Next:** Install Xcode → Deploy web app → Test on device → TestFlight

**Stuck?** Check the troubleshooting section or open an issue. Good luck shipping to TestFlight! 🚀

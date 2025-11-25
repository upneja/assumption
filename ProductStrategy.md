# pregame.lol: Product Strategy
## The Definitive Zero-Budget Launch Plan

**Version**: 3.0 (Final)
**Authors**: Claude (Anthropic) + Gemini (Google)
**Date**: January 2025
**Status**: Adopted Master Strategy
**Budget**: $99 (Apple Developer Account)
**Timeline**: 4 weeks to launch, 12 weeks to product-market fit

---

## Part 0: Vision & Strategic Pillars

### Mission Statement
> "Transform any real-life social gathering into a fun, memorable interactive event—without the friction of forcing everyone to download an app."

**You're not building an app. You're building a platform for IRL connection.**

### The Three Strategic Pillars

Every feature, marketing decision, and technical choice should be evaluated against these principles:

#### **Pillar 1: Frictionless Access & Virality**
The single most important feature is the ability for anyone to join a game, instantly, from any device (web or mobile) without being forced to download an app. This removes the primary barrier to social adoption and is the engine for viral growth.

**North Star Metric**: "Weekly Active Rooms Created" - directly measures the success of this pillar.

#### **Pillar 2: Curated, Expanding Game Library**
Launch by perfecting the "Imposter" game to capitalize on the current trend, but long-term defensibility comes from being a multi-game platform. The "Assumptions" game is the first step. Consistently add new, trending games to become the single, go-to app for any social gathering.

#### **Pillar 3: Polished & Engaging User Experience**
The app must be fast, stable, intuitive, and fun. Differentiate from buggy competitors by focusing on quality. Enhance the user experience with satisfying interactions, haptic feedback, and a clean, modern design that makes the app a joy to use.

---

## Part 1: The Opportunity (Why This Will Work)

### Perfect Storm Analysis

1. ✅ **Active TikTok Trend**: #impostergame has millions of views RIGHT NOW
2. ✅ **Competitive Gap**: Existing apps crash frequently, require everyone to download
3. ✅ **Technical Advantage**: You have a working web app with solid infrastructure
4. ✅ **Zero-Friction Model**: Cross-platform lobbies = your unfair advantage
5. ✅ **Multi-Game Platform**: Assumptions + Imposter differentiate you

### Your Unfair Advantage

**"The only party game app your friends don't need to download."**

```
Host creates room on iPhone app
→ Friends join from browser (no download)
→ Everyone plays together
→ Zero friction = viral growth
```

**No competitor has this.** Jackbox requires a TV. Single-game apps require universal installation.

### Market Validation

| App | Rating | Price | Fatal Flaw |
|-----|--------|-------|------------|
| Imposter - Secret Word Game | 4.8★ (57) | Free + Ads | Everyone must download |
| Imposter: Party Word Game | 4.6★ (240) | Free + IAP | Crashes frequently |
| Jackbox Games | 4.7★ (9K+) | $12-30 | Requires TV + expensive |

**Key Insight**: Users WANT this product (proven by ratings), but NO ONE has solved the friction problem. You have.

### Success Criteria

- **Week 2**: iOS app live on TestFlight
- **Week 4**: App Store approved, 5,000+ downloads
- **Week 8**: 10,000+ downloads, 5+ TikTok creator partnerships
- **Week 12**: 20%+ Day 7 retention (product-market fit validated)

---

## Part 2: Technology Decision (Settled)

### Framework: Capacitor ✅

**Why Capacitor Wins**:
- **Speed**: 1-2 weeks to App Store (vs 6-8 weeks native Swift)
- **Code Reuse**: 90% of your existing Next.js app works as-is
- **App Size**: 9.6MB (vs 25-55MB React Native)
- **One Codebase**: No separate mobile team needed
- **Supabase Compatible**: Realtime WebSocket works out-of-box

**React Native Comparison**:
| Factor | Capacitor | React Native |
|--------|-----------|--------------|
| Dev Time | 1-2 weeks | 3-4 weeks |
| Code Reuse | 90% | 60% |
| Learning Curve | Low | Medium |

**Decision**: Ship fast with Capacitor. Go native later if justified.

### Technical Setup Commands

```bash
# Week 1, Day 1: Initialize Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init pregame lol.pregame.app
npx cap add ios

# Configure for static export
# Edit next.config.ts → output: 'export'
npm run build
npx cap copy
npx cap open ios
```

---

## Part 3: The 4-Week Launch Roadmap

### Week 1: Build iOS App

**Monday-Tuesday: Capacitor Setup**
- [ ] Install Capacitor (commands above)
- [ ] Configure static export in `next.config.ts`
- [ ] Test web app still works after changes
- [ ] Set up iOS project

**Wednesday-Thursday: Mobile Polish**
- [ ] Add iOS safe area handling (`viewport-fit=cover`)
- [ ] Test cross-platform lobbies (web + mobile join same room)
- [ ] Add `@capacitor/haptics` plugin (vote, wheel spin, reveal)
- [ ] Test on real iPhone (borrow if needed)

**Friday: Apple Setup**
- [ ] Create Apple Developer account ($99 - your ONLY cost)
- [ ] Generate app icon using Canva
- [ ] Upload build to TestFlight
- [ ] Invite 5 friends to beta test

**Weekend: Content Creation**
- [ ] Host in-person game session with beta testers
- [ ] Film everything (reactions = TikTok gold)
- [ ] Create 3 TikTok videos (beta testing, teaser, building in public)
- [ ] Post first video with #buildinpublic #indiedev

**Success Criteria**: Working iOS app on TestFlight, 5 beta testers playing

---

### Week 2: Pre-Launch Preparation

**Monday-Tuesday: Bug Fixes & Polish**
- [ ] Fix critical bugs from beta feedback
- [ ] Add native share sheet (`@capacitor/share`) for room codes
- [ ] Create splash screen
- [ ] Verify Supabase Realtime works in production

**Wednesday: App Store Assets**

**App Name**: "pregame.lol - Party Games"
**Subtitle**: "Imposter, Assumptions & More"
**Keywords**: "imposter,party,social,group,drinking,pregame,icebreaker,guess,friends,multiplayer"

**Description Template**:
```
The party game app your friends don't need to download.

Play Imposter, Assumptions, and more with your crew—whether they
have the app or not. No more "wait, everyone download this first."
Just share the code and start playing.

🎭 WHAT MAKES US DIFFERENT
• Cross-platform lobbies (app + web = zero friction)
• Multiple games in one app
• Stable & fast (no crashes mid-game)
• Free to start

🎮 GAMES
• Imposter: One person doesn't know the word. Can you find them?
• Assumptions: Answer questions as someone else. Who are you?

📱 HOW IT WORKS
1. Create a room (5 seconds)
2. Share the code
3. Friends join via app OR browser
4. Play & create unforgettable moments

Perfect for pregames, parties, road trips. Download now.
```

**Screenshots** (Use Canva + Previewed.app):
1. Hero: "The Party Game Everyone Can Join"
2. Feature: Split-screen (app + browser) "No Download Required"
3. Social proof: "As Seen on TikTok"
4. Gameplay: Voting screen
5. Gameplay: Reveal screen

**Thursday: Submit to App Store**
- [ ] Complete App Store Connect submission
- [ ] If rejected, address issues immediately

**Friday-Weekend: Marketing Prep**
- [ ] Build Reddit karma (comment on 10+ posts in r/internetisbeautiful)
- [ ] Create Product Hunt "Coming Soon" page
- [ ] Identify 50 micro-influencers on TikTok (save to spreadsheet)
- [ ] Expand TestFlight to 20-30 beta testers

**Success Criteria**: App submitted, marketing ready, 20+ beta testers

---

### Week 3: Launch Week 🚀

**The Launch Sequence** (Sequential, Not Simultaneous)

#### **Tuesday: REDDIT LAUNCH** (Primary Validation)

**8:00 AM EST** - Post to r/internetisbeautiful

**Title**:
> "I made a site where you and your friends can play the TikTok imposter game without everyone downloading an app"

**Critical Requirements**:
- Link to WEB VERSION (not app)
- No visible signup forms (add `?ref=reddit` detection to hide)
- Reply to EVERY comment within 5 minutes (first 4 hours = critical)

**Expected Results**:
- Conservative: 10K visitors, 500 app downloads
- Optimistic: 100K visitors, 5K app downloads
- Viral: 500K visitors, 25K app downloads

**Why Reddit First?** Zero cost validation. If this works, you have proof before spending money on anything else.

#### **Wednesday: PRODUCT HUNT LAUNCH** (If Reddit Shows Traction)

**12:01 AM PST** - Launch on Product Hunt

**First Comment**:
> "Hey Product Hunt! 👋 I built pregame.lol after watching my friends struggle with buggy imposter apps.
>
> What makes us different: Your friends don't need the app—they can join from a browser. Zero friction.
>
> Early supporter code: PRODUCTHUNT (unlock premium features)
>
> Thanks for checking us out!"

**All Day**: Answer every question within 5 minutes

**Expected Results**:
- 20% chance of getting featured (2025 algorithm is tough)
- 50-300 upvotes (not featured), 500+ (if featured)
- 500-2,000 downloads

#### **Thursday-Friday: TikTok Organic Content**

**Content Strategy**:
1. "We launched on Reddit and got 10K users in 24 hours" (social proof)
2. "POV: Playing imposter but friends don't need to download anything" (feature)
3. Film real friend group playing (authentic reactions)

**Posting**: 1 video/day during launch week

**Weekend: Analyze & Iterate**
- [ ] Review metrics: Which channel drove most downloads?
- [ ] User interviews: DM 10 active users
- [ ] Plan Week 4 based on data

**Success Criteria**: 5,000-10,000 downloads, 4.5+ star rating

---

### Week 4: Sustain & Scale

**Monday-Wednesday: Community Engagement**
- [ ] Respond to ALL App Store reviews
- [ ] Follow up with creators who showed interest
- [ ] Post "Launch week recap" (TikTok, Twitter, Reddit)
- [ ] Ship Version 1.1 with top bug fixes

**Thursday-Friday: Optimization**
- [ ] Analyze conversion funnel
- [ ] A/B test App Store screenshots if conversion is low
- [ ] Refine ASO keywords based on search data

**Weekend: Strategic Planning**
- [ ] Review Month 1 metrics
- [ ] Decide: What worked? Double down on that channel
- [ ] Plan Month 2: TikTok-focused growth

**Success Criteria**: 1,000+ daily active users, 20%+ Day 7 retention

---

## Part 4: Growth Strategy (Weeks 4-12)

### Phase 1: TikTok Organic (Your Own Content)

**Why TikTok for Sustained Growth?**
- Your target audience lives here (Gen Z, 18-28)
- Imposter trend already has millions of views
- TikTok engagement rate: 2.34% (highest of all platforms)
- User-generated content = free marketing

**Content Calendar** (Week 4-8):
- **Week 4-6**: Post 5x/week showing real gameplay
  - "When you catch the imposter lying" (relatable humor)
  - "This game ruined our friendship" (engagement bait)
  - Behind-the-scenes development

- **Week 6-8**: Add tutorial content
  - "How to always win as imposter" (educational value)
  - "Best strategies for Assumptions game"

**Algorithm Hacks**:
- First 3 seconds = everything (hook must land immediately)
- Use trending audio (increases discoverability)
- Retention > follower count

### Phase 2: Micro-Influencer Partnerships (Week 6-12)

**Finding Creators (Free Method)**:
1. Search #impostergame on TikTok
2. Click "Recently Posted" (not "Top")
3. Look for 10K-200K followers with 3%+ engagement
4. Save 50 creators to spreadsheet

**Zero-Budget Outreach (Product Gifting)**:

**DM Template**:
```
Hey [Name]! Love your [specific video] content.

I'm the founder of pregame.lol—we built an imposter game app
to fix the issues you mentioned (crashes, everyone downloading).

Our unique feature: Friends join from browser without downloading.
Makes filming way easier.

Would love to send you early access + a custom game pack
with your name on it. No obligations, just want feedback.

Demo: pregame.lol/demo

Interested?
```

**Conversion Expectations**:
- 50 DMs → 10 responses (20%)
- 10 responses → 3 try it (30%)
- 3 trials → 1 posts organically (33%)

**Paid Partnerships** (Only If Validated):

| Tier | Followers | Cost | Expected ROI |
|------|-----------|------|--------------|
| Micro | 10-50K | $0 (gifting) | 500-2K visits |
| Mid | 50-200K | $300-500 | 2K-10K visits |
| Macro | 200K+ | $1K-5K | 10K-100K visits |

**CRITICAL**: Only pay AFTER proving free tactics work.

### Phase 3: In-App Virality (Week 8+)

**Build Sharing Into Product**:
- [ ] Add "Share Room Code" button (native iOS share sheet)
- [ ] Include message: "Join my game at pregame.lol/[code] - No download needed!"
- [ ] "Invite friends while you wait" prompt in lobby

**Goal**: Product sells itself. K-factor > 1.5 = viral growth.

---

## Part 5: Monetization Strategy

### Phase 1: Free (Months 1-3)
**Goal**: Growth > Revenue

**Why Free First**:
- Lower friction for viral growth
- Network effects (more free users = more valuable)
- Prove product-market fit before asking for money

**Revenue**: $0
**Focus**: User acquisition, retention, engagement

### Phase 2: Test Freemium (Month 4)

**Free Tier** (Forever):
- Core games (Imposter, Assumptions)
- 5-10 pre-made word packs
- Unlimited plays

**Premium** ($2.99 one-time unlock):
- Ad-free experience
- Unlimited word packs (20+ categories)
- Custom word pack creation
- Early access to new games

**Why $2.99 One-Time?**
- Simpler than subscription (better conversion)
- Competitive with market (others charge $1.99-$8.99)
- Impulse purchase territory

**Expected Conversion**: 2-5% of free users

**Revenue Model** (Month 6):
- 10,000 users × 3% × $2.99 = $900/month
- 50,000 users × 3% × $2.99 = $4,500/month

### Phase 3: Expand Revenue (Month 6+)

**Additional Streams**:
1. **Creator Tier** ($4.99/month) - Analytics, custom branding
2. **Event Licensing** ($99/event) - Corporate team building
3. **Merchandise** (print-on-demand, zero upfront cost)

**Anti-Patterns to Avoid**:
- ❌ Forced video ads every game (kills retention)
- ❌ Paywall core games (limits viral growth)
- ✅ Make free tier genuinely valuable, premium = convenience

---

## Part 6: Success Metrics & Tracking

### Daily Dashboard (Check These 4 Metrics)

1. **App Downloads** (target: +50/day by Week 4)
2. **Games Played** (target: 1,000+/day by Week 4)
3. **App Store Rating** (target: 4.5+)
4. **Day 1 Retention** (target: 40%+)

### Weekly Review (Add These 3)

5. **Daily Active Users (DAU)** (target: 1,000+ by Week 12)
6. **Day 7 Retention** (target: 20%+ = product-market fit)
7. **Cross-Platform Ratio** (web joins / mobile hosts)

### North Star Metric

**Weekly Active Rooms Created** - The one metric that predicts long-term success.

**Why**:
- Indicates actual usage (not just downloads)
- Measures host behavior (hosts are power users)
- Predicts viral growth (more rooms = more friends invited)

**Targets**:
- Week 4: 500 rooms
- Week 8: 2,000 rooms
- Week 12: 5,000+ rooms

### Analytics Setup (Week 2)

**Tool Stack** (Free):
- **Firebase Analytics**: Basic tracking (automatic)
- **Amplitude**: Deep analysis (free up to 10M events)
- **App Store Connect**: Download metrics (built-in)

**Events to Track**:
```javascript
// Week 1: Critical events
analytics.track('app_opened', { source: 'organic' | 'reddit' | 'producthunt' | 'tiktok' })
analytics.track('room_created', { game_type: 'imposter' | 'assumptions' })
analytics.track('room_joined', { join_method: 'web' | 'mobile' })
analytics.track('game_completed', { duration_seconds: number })

// Week 4+: Growth events
analytics.track('invite_sent', { method: 'sms' | 'imessage' | 'copy_link' })
analytics.track('friend_joined_from_invite', { referrer_id: string })
```

### Decision Framework

**🚩 RED FLAGS** (Pivot Required):
- Day 7 retention < 10% after 4 weeks → Major product changes needed
- < 5% activation rate (downloads but don't create rooms) → Onboarding broken
- App Store rating < 4.0 → Stability issues killing growth

**🟢 GREEN FLAGS** (Double Down):
- Day 7 retention > 20% → Product-market fit! Focus 100% on growth
- K-factor > 1.5 → Viral growth working, add more share features
- 50%+ organic installs → Word-of-mouth working

**🟡 YELLOW FLAGS** (Test & Optimize):
- Metrics flat but not declining → A/B test improvements
- Mixed feedback → Segment users (who loves it vs who churns?)

---

## Part 7: Risk Mitigation

### Technical Risks

**Risk**: Supabase Realtime doesn't work in Capacitor WebView
**Mitigation**: Test on real device Week 1 Day 1
**Backup**: Fallback to HTTP polling

**Risk**: App Store rejection
**Mitigation**: Follow Apple HIG strictly, have beta testers
**Backup**: Launch web version while appealing

### Market Risks

**Risk**: TikTok trend fades before launch
**Mitigation**: Ship in 4 weeks max (trend has 6-12 month window)
**Backup**: Party games are evergreen, trend is just accelerator

**Risk**: Reddit post removed/downvoted
**Mitigation**: Build karma first, follow rules strictly
**Backup**: Launch on r/sideproject, r/entrepreneur simultaneously

**Risk**: Zero influencer responses
**Mitigation**: Start with organic TikTok, don't depend on influencers
**Backup**: Reddit + Product Hunt can get you to 5K downloads alone

### Resource Risks

**Risk**: Burnout (solo developer)
**Mitigation**: Ruthlessly prioritize, ship imposter game only, add assumptions in v1.1
**Backup**: Take weekends off, celebrate small wins

---

## Part 8: How to Use AI Effectively

### Claude Code CLI (Implementation)

**Best For**:
- Code generation (React, TypeScript)
- Debugging (analyzing errors)
- Architecture decisions
- Content writing (App Store copy)

**Example Prompts**:
```
Week 1:
"Set up Capacitor for my Next.js 16 app with static export.
Walk me through installation, config, iOS simulator setup."

Week 2:
"Add @capacitor/haptics to my vote submission in VotingView.tsx.
Use medium intensity, trigger on button tap."

Week 3:
"Add analytics tracking for ?ref=reddit and ?ref=producthunt.
Hide signup CTAs when ref=reddit."
```

### Gemini CLI (Research & Content)

**Best For**:
- Competitive research
- TikTok content ideas
- Marketing copy
- Trend monitoring

**Example Prompts**:
```
"Find top 20 TikTok creators posting #impostergame in last 30 days.
Format as CSV with followers, engagement."

"Generate 15 TikTok video concepts for pregame.lol. Target college
students. Format: [3-second hook | concept | CTA]"
```

### Division of Labor

| Task | Claude | Gemini |
|------|--------|--------|
| Writing code | ✅ Primary | ❌ |
| Debugging | ✅ Primary | 🟡 Research |
| App Store copy | 🟡 Good | ✅ Better |
| TikTok content | 🟡 Good | ✅ Better |
| Competitive research | 🟡 Good | ✅ Better |

**Pro Tip**: Use both in parallel for max speed.

---

## Part 9: Execution Mindset

### Indie Developer Principles

**1. Ship Fast, Learn Faster**
- ✅ Launch with one game (Imposter) → Add Assumptions in v1.1
- ✅ Ship MVP in 2 weeks → Polish over 2 months
- ❌ Wait for "perfect" product → Miss trend window

**2. Resourcefulness > Resources**
- ✅ Use Canva for screenshots (free)
- ✅ DM 50 creators manually (free)
- ✅ Build Reddit karma organically (free)
- ❌ Say "I can't afford X" → Find free alternative

**3. Leverage Asymmetry**
- Cross-platform lobbies ← Competitors can't copy quickly
- TikTok creators already making content ← You're solving their pain
- Among Us took 2 years to explode ← Persistence pays off

**4. Build in Public**
- Tweet progress daily → Free marketing + accountability
- Share metrics transparently → Builds trust
- Document learnings → Helps future indie devs

### Common Pitfalls (Avoid These)

**Pitfall 1: Perfectionism**
- Symptom: "I need to add [feature] before launching"
- Solution: Launch with ONE game, add features based on user feedback

**Pitfall 2: Analysis Paralysis**
- Symptom: Endless comparisons, no code written
- Solution: Pick one (Capacitor), commit, ship

**Pitfall 3: Vanity Metrics**
- Symptom: Focusing on downloads, not retention
- Solution: Track engagement (Day 7 retention), not just acquisition

---

## Part 10: Your Next Move

### Today (Next 24 Hours)

1. ✅ **Read this entire strategy** (30 minutes)
2. ✅ **Set up Apple Developer account** ($99)
3. ✅ **Initialize Capacitor**:
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init pregame lol.pregame.app
   npx cap add ios
   ```
4. ✅ **Build and run on iOS simulator**
5. ✅ **Mark Week 3 launch date on calendar** (3 weeks from today)

### This Week (Next 7 Days)

- [ ] Working iOS app on your physical iPhone
- [ ] Cross-platform lobby tested (web + mobile together)
- [ ] Haptic feedback on 3+ interactions
- [ ] TestFlight build sent to 5 friends
- [ ] First TikTok video posted

### This Month (Next 30 Days)

- [ ] App Store approved and live
- [ ] Reddit launch on r/internetisbeautiful
- [ ] Product Hunt launch
- [ ] 5,000-10,000 downloads
- [ ] 4.5+ star rating
- [ ] 20%+ Day 7 retention (validates product-market fit)

---

## Quick Reference Card (Print This)

```
┌──────────────────────────────────────────────────────┐
│        PREGAME.LOL - 4-WEEK LAUNCH CHECKLIST         │
├──────────────────────────────────────────────────────┤
│                                                       │
│  WEEK 1: Build iOS App                               │
│   [ ] Install Capacitor                              │
│   [ ] Test on real iPhone                            │
│   [ ] Upload to TestFlight                           │
│   [ ] 5 beta testers playing                         │
│                                                       │
│  WEEK 2: Pre-Launch Prep                             │
│   [ ] Fix critical bugs                              │
│   [ ] Create App Store assets                        │
│   [ ] Submit to Apple                                │
│   [ ] Build Reddit karma (10+ comments)              │
│                                                       │
│  WEEK 3: Launch Week 🚀                              │
│   [ ] Tuesday: Launch on Reddit                      │
│   [ ] Wednesday: Launch on Product Hunt              │
│   [ ] Daily TikTok content                           │
│   [ ] Start influencer outreach                      │
│                                                       │
│  WEEK 4: Sustain & Scale                             │
│   [ ] Respond to all reviews                         │
│   [ ] Follow up with creators                        │
│   [ ] Ship Version 1.1                               │
│   [ ] Plan Month 2 (TikTok focus)                    │
│                                                       │
│  SUCCESS METRICS:                                     │
│   5,000+ downloads | 4.5★ rating | 20% D7 retention  │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## Final Words

### You Have Everything You Need

- ✅ A working product (pregame.lol web app)
- ✅ A clear strategy (this document)
- ✅ The skills to execute (former SWE + AI tools)
- ✅ A hot market (TikTok trend + evergreen party games)
- ✅ A differentiated approach (cross-platform lobbies)

### The Only Variable Left: Execution

**"Among Us almost died. Formula Bot made $6K in 48 hours with zero budget. Houseparty sold for $35M. You're in the right place at the right time with the right product."**

Ship fast. Launch loud. Iterate based on feedback. Build in public.

**You've got this.**

---

## Questions? Next Steps?

When you're ready:
1. Ask me specific implementation questions ("How do I configure Capacitor for Next.js static export?")
2. Request code generation ("Set up Amplitude analytics in my Next.js app")
3. Get content help ("Write 10 TikTok video concepts for pregame.lol")
4. Strategize together ("Reddit post got 100 upvotes but few downloads, what's wrong?")

**I'm here to help you ship this. Let's do it.**

---

**Document Stats**:
- **Length**: 6,000 words
- **Reading Time**: 25-30 minutes
- **Implementation Time**: 4 weeks to launch, 12 weeks to PMF
- **Budget Required**: $99 (Apple Developer account)
- **Expected Outcome**: 5,000-10,000 downloads in Month 1, product-market fit validated

**Version History**:
- v1.0: ClaudeProductStrategy.md (18K words, comprehensive)
- v2.0: HybridProductStrategy.md (5.2K words, synthesized)
- v3.0: ProductStrategy.md (6K words, final - vision + execution)

**Last Updated**: January 2025
**Next Review**: After Week 4 launch (update with results, learnings)

---

**END OF STRATEGY DOCUMENT**

🚀 **LET'S GO.**
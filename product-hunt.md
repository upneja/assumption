# Product Hunt Launch Materials for pregame.lol

## PRODUCT HUNT TAGLINE (60 chars max)

### Option A (48 chars)
```
Party games where friends don't need to download
```

### Option B (59 chars)
```
Host downloads, friends join from browser. Zero friction.
```

### Option C (54 chars)
```
The party game app that doesn't require an app
```

**RECOMMENDED:** Option A (clearest value prop, shortest)

---

## PRODUCT HUNT DESCRIPTION (500 chars max)

### Version 1 (489 chars)
```
pregame.lol is a party game app designed for the moment when someone says "let's play a game" and everyone groans about downloading another app.

Here's how it works: one person (the host) downloads the app. They start a game and share a join code. Everyone else goes to pregame.lol in their browser and joins instantly - no download, no account, no friction.

Current games:
🎭 Imposter - Among Us style social deduction
💭 Assumptions - Spicy "who's most likely to..." questions

Built for pregames, parties, and icebreakers.
```

### Version 2 (468 chars)
```
Every party game has the same problem: getting everyone to download the app kills the vibe.

pregame.lol fixes this. The host downloads the app, everyone else joins from their browser. Under 30 seconds from "let's play" to actually playing.

Play Imposter (Among Us for parties) or Assumptions (spicy friend questions) with 4-12 people.

Perfect for:
- College pregames
- Icebreakers
- Friend hangouts
- Any time you want a quick party game without the download friction

Free forever.
```

**RECOMMENDED:** Version 2 (more specific use cases, mentions "free")

---

## FIRST COMMENT (Value Bomb + Roadmap)

**POST THIS IMMEDIATELY AFTER LAUNCHING**

```
Hey Product Hunt! 👋

I'm [YOUR NAME], solo dev behind pregame.lol. Super excited (and nervous) to launch here!

**The problem I'm solving:**

You know that moment at a party when someone suggests playing a game, then 20 minutes later everyone's still trying to download the app, figure out how to join, and you've missed your Uber? Yeah, that.

**How pregame.lol is different:**

- Host downloads the app (iOS for now)
- Guests join from browser - literally just type pregame.lol and enter a code
- Everyone's playing in under 30 seconds

No accounts, no downloads for guests, no friction.

**Current games:**

🎭 **Imposter** - Social deduction game (Among Us vibes). One player is lying, everyone else tries to figure out who.

💭 **Assumptions** - Spicy question game. "Who's most likely to ghost someone?" Everyone votes. Drama ensues.

Both games work best with 4-12 people.

**What's next (roadmap):**

- Android host app (coming soon - guests already work on Android browsers)
- Custom question packs (create your own Assumptions questions)
- More game modes (thinking trivia, drawing games, etc.)
- Party mode (play multiple games in one session)
- Analytics for hosts (see which questions got the most votes, etc.)

**Special offer for PH community:**

Use code **PRODUCTHUNT** at launch for early access to custom question packs when they drop. I'll also prioritize feature requests from this thread.

**What I need help with:**

- Honest feedback (what works, what sucks)
- Ideas for new game modes
- Tech stuff: built with React Native + Next.js. Open to questions about the stack.

**Try it:**
pregame.lol or search "pregame.lol" in the App Store

Would love to hear your thoughts! Happy to answer any questions about the product, the tech, or the launch journey.

Thanks for checking it out! 🎉
```

**LENGTH:** ~330 words

**KEY ELEMENTS:**
- Personal intro (humanizes you)
- Clear problem statement (relatable)
- How it works (simple explanation)
- Current features (what's available now)
- Roadmap (shows you're committed)
- Exclusive offer (makes PH community feel special)
- Call for feedback (invites engagement)
- Tech details (for developer audience)

---

## RESPONSE TEMPLATES FOR COMMON QUESTIONS

### Q1: "How is this different from [Competitor]?"

**Template:**
```
Great question! The main difference is the no-download-for-guests model.

With [COMPETITOR], everyone needs the app. With pregame.lol, only one person downloads it, everyone else joins from their phone's browser.

This makes it way easier to get a game started, especially at parties where people are hesitant to download yet another app.

The trade-off: we have fewer games right now (2 vs [COMPETITOR]'s [X]). But we're focusing on quality over quantity - the games we have are polished and party-tested.

Make sense?
```

---

### Q2: "What's your monetization plan?"

**Template:**
```
Freemium model with a twist:

**Free forever:**
- Base games (Imposter, Assumptions)
- Core gameplay features
- No ads

**Premium (future):**
- Custom question packs ($2-5 one-time, or create your own)
- Themed game modes (holiday packs, brand collaborations, etc.)
- Host analytics (which questions got the most votes, player stats, etc.)
- Maybe a "Pro Host" tier for people who run a lot of games

The goal is to keep the core experience free so anyone can play, but charge for customization and extra content.

Not trying to squeeze every dollar out of users - just want to make it sustainable.
```

---

### Q3: "Will there be an Android version?"

**Template:**
```
Android host app is in progress!

Current state:
- ✅ Guests can join from Android browsers (works great)
- ⏳ Host app for Android (coming in [TIMEFRAME - be realistic])

Built with React Native so most of the code is shared, but need to handle Android-specific stuff (notifications, deep linking, etc.) properly before releasing.

If you're on Android and want to try it, grab an iPhone friend to host and you can still play as a guest!
```

---

### Q4: "How do you handle moderation/inappropriate content?"

**Template:**
```
Good question. Here's the current approach:

**Question moderation:**
- Pre-written questions are curated by me (no user-generated in the base game)
- Filtering out anything offensive, discriminatory, or overly explicit
- Trying to keep it spicy but not offensive

**User behavior:**
- Games are private (only people with the code can join)
- Host can kick players if needed
- No public lobbies, so less moderation risk

**Future (when we add custom questions):**
- Profanity filter
- Report button
- Review system for shared custom packs

Since it's designed for friend groups who trust each other, moderation is less critical than public platforms. But definitely something I'm thinking about as we scale.
```

---

### Q5: "Is this just for drinking games?"

**Template:**
```
Not at all! Though it works great for pregames (hence the name).

Use cases we've seen:
- College pregames (yes, often with drinking)
- Family game nights (SFW question mode)
- Corporate icebreakers (surprisingly popular for team building)
- Road trips (Imposter mode is great for long drives)
- Friend hangouts (just for fun)

The games are designed to be fun regardless of drinking. You can play with water, juice, or nothing at all.

I'm considering adding a "family-friendly mode" toggle that filters questions to be more PG. Would that be useful for you?
```

---

### Q6: "Can I play solo or do I need friends?"

**Template:**
```
You need at least 4 people to play (it's a social party game).

If you want to test it solo, you can open multiple browser windows and simulate players, but the real fun is with actual people reacting and discussing.

We're not building a single-player mode since the core value is the social experience. But if you're looking for party game ideas, you could try it with [ALTERNATIVE SUGGESTION].
```

---

### Q7: "What tech stack did you use?"

**Template:**
```
Happy to share!

**Mobile (Host App):**
- React Native (cross-platform iOS/Android)
- Expo for rapid development
- Native features via Capacitor

**Web (Guest Experience):**
- Next.js (React framework)
- TypeScript
- Tailwind CSS

**Backend:**
- [YOUR BACKEND - e.g., Firebase, Supabase, custom API]
- WebSocket for real-time game sync

**Hosting:**
- Vercel (web)
- [YOUR MOBILE HOSTING]

The React Native + Next.js combo lets me share components between mobile and web, which is huge for a solo dev.

Happy to answer specific tech questions!
```

---

### Q8: "How did you validate the idea before building?"

**Template:**
```
Honestly? I built it for my own friend group first.

**Validation process:**
1. Tried existing party game apps → all had the download problem
2. Built MVP in [TIMEFRAME] with just Imposter mode
3. Tested at actual pregames with friends (very scientific lol)
4. Watched where people got confused or bored
5. Iterated based on feedback
6. Added Assumptions mode based on requests

The best validation was watching people actually have fun playing it. When friends started asking "when are you launching this?" I knew it was time.

Not the most rigorous validation process, but for a $0 budget solo project, it worked.
```

---

### Q9: "Do you have a demo/video?"

**Template:**
```
Yes! Here's a quick demo:

[VIDEO LINK - host your demo on YouTube/Loom]

Shows the full flow:
1. Host downloads app
2. Guests join from browser
3. Playing Imposter mode
4. The reveal moment

Total time from start to playing: ~30 seconds.

Let me know if you have questions after watching!
```

---

### Q10: "What's your user acquisition strategy?"

**Template:**
```
Bootstrapped approach (aka $0 budget):

**What's working:**
- Word of mouth (friends telling friends)
- TikTok (showing the product in action)
- College marketing (Greek life influencers)

**What I'm testing:**
- This Product Hunt launch!
- Reddit (r/internetisbeautiful, r/sideproject)
- Influencer outreach (small creators, not big sponsorships)

**Built-in viral loop:**
The product naturally spreads - host invites friends, friends see the game, friends want to host their own. Each game is a mini-demo.

Not doing paid ads. Focusing on organic growth through actually making something people want to share.

Open to suggestions if you have ideas!
```

---

## PRE-LAUNCH CHECKLIST

**1 Week Before:**
- [ ] Schedule launch date (Tuesday-Thursday are best)
- [ ] Prepare Product Hunt assets (logo, screenshots, demo video)
- [ ] Write tagline and description
- [ ] Draft first comment
- [ ] Create PRODUCTHUNT promo code
- [ ] Set up analytics to track PH traffic

**3 Days Before:**
- [ ] Notify your existing users (if any) to upvote
- [ ] Prep response templates
- [ ] Test app thoroughly (PH hunters will find bugs)
- [ ] Have demo video ready
- [ ] Clear your schedule for launch day

**Launch Day:**
- [ ] Launch at 12:01am PST (get full day of visibility)
- [ ] Post first comment immediately
- [ ] Respond to EVERY comment within 1 hour
- [ ] Share on Twitter, LinkedIn, etc.
- [ ] Ask friends/family to upvote (not against rules)
- [ ] Monitor analytics

**Post-Launch:**
- [ ] Thank everyone who engaged
- [ ] Share results (metrics, feedback, learnings)
- [ ] Follow up on feature requests mentioned
- [ ] Add "Featured on Product Hunt" badge to website

---

## PRODUCT HUNT BEST PRACTICES

### DO:
- ✅ Launch Tuesday-Thursday (most traffic)
- ✅ Launch at 12:01am PST (full day of visibility)
- ✅ Respond to every single comment
- ✅ Be humble and grateful
- ✅ Share your journey/learnings
- ✅ Offer exclusive deal to PH community
- ✅ Have demo video ready
- ✅ Use high-quality screenshots

### DON'T:
- ❌ Buy upvotes (you'll get banned)
- ❌ Spam people to upvote
- ❌ Get defensive about criticism
- ❌ Ignore negative feedback
- ❌ Launch on Monday or Friday
- ❌ Disappear after posting
- ❌ Over-promise features that don't exist yet

---

## METRICS TO TRACK

**During Launch:**
- Upvotes (goal: top 5 of the day)
- Comments (engagement matters more than votes)
- Website traffic from PH
- App downloads from PH
- PRODUCTHUNT code uses

**Post-Launch:**
- Retention (do PH users stick around?)
- Feedback themes (what features people want)
- Conversion rate (visitors → downloads)
- Press mentions (some journalists browse PH)

---

## SAMPLE MILESTONE UPDATES

If you hit #1 or top 5, post an update:

```
🎉 We hit #[RANK] Product of the Day!

Holy crap. When I started building pregame.lol [TIMEFRAME] ago, I didn't expect this.

Thank you to everyone who:
- Upvoted
- Left feedback
- Tried the app
- Suggested features

Special shoutout to [TAG PARTICULARLY HELPFUL COMMENTERS].

I'm reading every single comment and adding your feature requests to the roadmap. Keep them coming!

If you haven't tried it yet: pregame.lol

Let's keep this going! 🚀
```

---

## POST-LAUNCH FOLLOW-UP

**1 Week After:**
Post a "lessons learned" on Product Hunt or your blog:

- Total upvotes: [X]
- Ranking: #[X] of the day
- Traffic: [X] visitors from PH
- Downloads: [X] from PH community
- Top requested features: [LIST]
- Unexpected feedback: [INSIGHT]
- What I'd do differently: [LEARNING]

This content is valuable to other makers and keeps you visible in the PH community.

---

## HUNTER vs SELF-POSTING

**Self-Posting (Recommended for pregame.lol):**
- ✅ You control the narrative
- ✅ You respond directly
- ✅ More authentic
- ❌ Might get less initial visibility

**Getting Hunted:**
- ✅ Potentially more visibility
- ✅ Credibility from known hunter
- ❌ Less control over messaging
- ❌ Need to convince someone to hunt you

For a solo maker with a consumer app, self-posting is fine. Focus on engaging with the community rather than getting a "name" hunter.

---

## EXAMPLE SUCCESS STORY FORMAT

If pregame.lol does well, document it:

```
How pregame.lol hit #3 on Product Hunt with $0 marketing budget

Background:
- Solo dev, no previous launches
- Built in [TIMEFRAME]
- Zero budget

Prep:
- Tested app with 50+ beta users
- Created demo video showing real usage
- Wrote response templates for common questions

Launch day:
- Posted at 12:01am PST
- Responded to every comment within 30 min
- Shared in relevant communities (not spam)

Results:
- #3 Product of the Day
- [X] upvotes
- [X] downloads
- [X] new users

What worked:
- Clear, simple value prop
- Demo video showing real people having fun
- Engaged authentically with every comment
- Exclusive offer for PH community

What I'd change:
- [HONEST REFLECTION]
```

Share this on Twitter, Reddit, Indie Hackers, etc. Other makers love launch stories.

---

Good luck with the launch! 🚀

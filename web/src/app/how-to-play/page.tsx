import Link from 'next/link';

const games = [
  {
    id: 'assumptions',
    name: 'Assumptions',
    tagline: 'Social intuition, light chaos, instant icebreaking.',
    summary:
      'Built for any social mix, Assumptions turns the awkward "getting to know you" stuff into a guessing game. You might be playing as your best friend or someone you just met five minutes ago - either way, you have to fake it like you know their lore.',
    beats: [
      'Everyone joins on their phone and gets secretly assigned a random person in the room.',
      'After a quick intro round, a wheel picks someone for the hot seat.',
      'The hot seat answers questions as if they were their assigned person. No slipping.',
      'The group debates and votes on who they were pretending to be.',
      "Right guess? You're perceptive. Wrong guess? That tracks.",
      'Rounds keep rotating until two players remain, then it becomes the final showdown of who was actually paying attention tonight.',
    ],
    inShort: 'Play as someone else, bluff hard, and see who actually knows the room.',
    accent: 'from-purple-500 via-fuchsia-500 to-amber-400',
  },
  {
    id: 'imposter',
    name: 'Guess the Imposter',
    tagline: 'Find the faker before they talk their way out.',
    summary:
      'Classic social deduction with a phone-first spin. Everyone thinks they know what is going on - except one player who is in the dark and trying to improvise their way through the round.',
    beats: [
      "Everyone joins on their phone and gets the round's prompt or topic. One player (the imposter) gets nothing.",
      'Each person gives a short take, hint, or answer that proves they know the prompt.',
      'The imposter listens, bluffs, and tries to sound convincing without real info.',
      'After a couple of quick passes, the group grills suspects and locks in a vote.',
      'Nail the imposter and the room wins. Let them slip by and you just gave the faker bragging rights.',
    ],
    inShort: 'Keep your answers tight, read the room, and smoke out the clueless one.',
    accent: 'from-cyan-400 via-sky-500 to-indigo-500',
  },
];

export default function HowToPlayPage() {
  return (
    <div className="min-h-screen relative overflow-hidden px-4 py-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-50 animate-gradient-bg blur-3xl" />
        <div className="absolute -left-32 top-10 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl floaty" />
        <div className="absolute -right-24 bottom-10 w-80 h-80 bg-cyan-400/15 rounded-full blur-3xl floaty" />
      </div>

      <div className="relative max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-200 hover:text-white transition"
          >
            <span className="text-lg">{"<-"}</span>
            Back to games
          </Link>
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm font-semibold bg-white/10 border border-white/20 hover:bg-white/15 transition"
          >
            Host a room
          </Link>
        </div>

        <header className="space-y-3">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">pregame.lol</div>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
            How to play our games
          </h1>
          <p className="text-slate-200 text-base md:text-lg max-w-2xl">
            Quick primers for anyone jumping in. Send this to the group chat, or skim it right
            before you host.
          </p>
        </header>

        <section className="grid gap-5">
          {games.map((game) => (
            <article
              key={game.id}
              className="neon-card rounded-3xl p-6 md:p-8 border border-white/10 bg-white/5"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    {game.id}
                  </div>
                  <h2 className="text-3xl font-black text-white">{game.name}</h2>
                  <p className="text-slate-200">{game.tagline}</p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full bg-gradient-to-r ${game.accent} text-black font-semibold shadow-lg`}
                >
                  Phone-first party mode
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
                  <p className="text-slate-100 leading-relaxed">{game.summary}</p>
                </div>

                <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-4">
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-white/10 to-white/5 p-4 md:p-5 space-y-3">
                    <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Round flow</div>
                    <ul className="space-y-2 text-slate-100">
                      {game.beats.map((beat, idx) => (
                        <li key={idx} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-sm font-bold text-white">
                            {idx + 1}
                          </div>
                          <p className="leading-relaxed">{beat}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5 space-y-3">
                    <div className="text-sm uppercase tracking-[0.2em] text-slate-400">In short</div>
                    <p className="text-white text-lg font-semibold leading-relaxed">{game.inShort}</p>
                    <div className="text-slate-300 text-sm bg-white/5 border border-white/10 rounded-xl p-3">
                      Best with 4-12 people. Works in a living room, a bar booth, or anywhere the
                      wifi is mid but the energy is high.
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="space-y-2">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Ready up</div>
            <h3 className="text-2xl font-black text-white">Spin up a room in seconds</h3>
            <p className="text-slate-200">
              Share the link, let everyone join on their phone, and jump straight into the first
              round.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full px-5 py-3 text-sm font-semibold bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 text-black shadow-xl hover:scale-[1.01] transition"
          >
            Go to lobby
          </Link>
        </div>
      </div>
    </div>
  );
}

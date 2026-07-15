export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <section className="w-full max-w-2xl rounded-3xl bg-grey-gradient p-10 shadow-2xl ring-1 ring-white/8">
        <p className="text-text-sm font-semibold uppercase tracking-widest text-aster-teal-400">
          Aster Horoscope
        </p>
        <h1 className="mt-3 text-display-md font-bold text-grey-50">
          Unveil your daily tarot
        </h1>
        <p className="mt-4 text-text-lg text-grey-300">
          Draw a card, take on a horoscope mission, and reveal your result.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="/draw"
            className="inline-block rounded-full bg-brand-gradient px-8 py-3 text-text-md font-semibold text-grey-950 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-sky-400"
          >
            Draw a Card
          </a>
          <a
            href="/game"
            className="inline-block rounded-full px-8 py-3 text-text-md font-semibold text-grey-100 ring-1 ring-white/16 transition-colors hover:bg-white/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-sky-400"
          >
            Play Tarot Match
          </a>
          <a
            href="/echoes"
            className="inline-block rounded-full px-8 py-3 text-text-md font-semibold text-grey-100 ring-1 ring-white/16 transition-colors hover:bg-white/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-sky-400"
          >
            Echoes of the Stars
          </a>
        </div>
      </section>
      <p className="text-text-sm text-grey-500">
        Foundation scaffold — Solar Design System tokens active.
      </p>
    </main>
  );
}

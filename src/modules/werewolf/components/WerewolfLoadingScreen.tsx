import Image from "next/image";

export function WerewolfLoadingScreen() {
  return (
    <main
      className="relative flex min-h-[100dvh] items-end justify-center overflow-hidden bg-[#020508] text-[#ddd2c0]"
      role="status"
      aria-live="polite"
      aria-label="Connecting to Aster Village"
    >
      <Image
        src="/werewolf-game/system/loading-screen.png"
        alt=""
        fill
        sizes="100vw"
        priority
        className="animate-werewolf-loading-scene object-cover"
      />
      <div aria-hidden className="animate-werewolf-loading-mist absolute inset-0 bg-[radial-gradient(ellipse_at_50%_72%,rgba(118,132,150,0.18),transparent_42%)]" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/25" />

      <div className="relative z-10 mb-[7vh] flex flex-col items-center gap-3 text-center">
        <p className="animate-werewolf-loading-text font-serif text-sm font-black uppercase tracking-[0.3em] text-[#dbc7a4] drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)] sm:text-lg">
          Entering Aster Village
        </p>
        <span className="flex items-center gap-2" aria-hidden>
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="animate-werewolf-loading-dot h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
              style={{ animationDelay: `${index * 0.2}s` }}
            />
          ))}
        </span>
      </div>
    </main>
  );
}

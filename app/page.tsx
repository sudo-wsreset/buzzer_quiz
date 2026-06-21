export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Space background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500 opacity-5 blur-3xl rounded-full" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-fuchsia-500 opacity-5 blur-3xl rounded-full" />
      </div>
      
      <div className="relative z-10">
        <h1 className="text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-lime-400">
          🔔 BUZZER QUIZ
        </h1>
        <p className="text-cyan-300/70 mb-10 text-center max-w-sm font-medium tracking-wide">
          Real-time buzzer system for offline quiz nights.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <a
            href="/admin"
            className="text-center py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 text-black font-bold text-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 border border-cyan-300"
          >
            Admin Panel
          </a>
          <a
            href="/buzzer"
            className="text-center py-4 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 font-bold text-lg hover:shadow-lg hover:shadow-fuchsia-500/50 transition-all duration-300 border border-fuchsia-300"
          >
            Team Buzzer
          </a>
        </div>
        <p className="text-cyan-400/50 text-xs mt-12 text-center max-w-xs font-mono">
          Project the Admin Panel on a screen. Teams open the Buzzer link on
          their own phones.
        </p>
      </div>
    </div>
  );
}

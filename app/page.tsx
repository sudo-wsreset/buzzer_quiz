export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center px-6">
      <h1 className="text-3xl font-extrabold mb-2">🔔 Buzzer Quiz</h1>
      <p className="text-neutral-400 mb-10 text-center max-w-sm">
        Real-time buzzer system for offline quiz nights.
      </p>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <a
          href="/admin"
          className="text-center py-4 rounded-xl bg-white text-black font-bold text-lg hover:opacity-90 transition"
        >
          Admin Panel
        </a>
        <a
          href="/buzzer"
          className="text-center py-4 rounded-xl bg-red-600 font-bold text-lg hover:opacity-90 transition"
        >
          Team Buzzer
        </a>
      </div>
      <p className="text-neutral-600 text-xs mt-12 text-center max-w-xs">
        Project the Admin Panel on a screen. Teams open the Buzzer link on
        their own phones.
      </p>
    </div>
  );
}

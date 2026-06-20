export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-2">404</h1>
        <p className="text-neutral-400 mb-6">Page not found</p>
        <a
          href="/"
          className="px-6 py-3 rounded-lg bg-white text-black font-bold hover:opacity-90 transition"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

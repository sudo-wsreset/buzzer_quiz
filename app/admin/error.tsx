"use client";

import { useEffect } from "react";
import { logger } from "@/lib/utils";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Admin Panel Error", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold mb-2">🔔 Admin Error</h1>
        <p className="text-neutral-400 mb-6">
          The admin panel encountered an error. Please try again.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-xs bg-neutral-900 p-3 rounded-lg text-red-400 overflow-auto text-left mb-4">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 px-4 py-2 rounded-lg bg-white text-black font-bold hover:opacity-90 transition"
          >
            Retry
          </button>
          <a
            href="/"
            className="flex-1 px-4 py-2 rounded-lg bg-neutral-800 text-white font-bold hover:bg-neutral-700 transition text-center"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

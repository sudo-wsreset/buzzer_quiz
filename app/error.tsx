"use client";

import { useEffect } from "react";
import { logger } from "@/lib/utils";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Error Boundary", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold mb-2">⚠️ Something went wrong</h1>
        <p className="text-neutral-400 mb-6">
          An unexpected error occurred. Please try again or refresh the page.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-xs bg-neutral-900 p-3 rounded-lg text-red-400 overflow-auto text-left mb-4">
            {error.message}
          </pre>
        )}
        <button
          onClick={reset}
          className="px-6 py-3 rounded-lg bg-white text-black font-bold hover:opacity-90 transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

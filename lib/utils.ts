/**
 * Utility functions for error handling, logging, and common operations
 */

// Development mode check
export const isDev = process.env.NODE_ENV === "development";

// Logger utility
export const logger = {
  error: (label: string, error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    if (isDev) {
      console.error(`[${label}]`, error);
    } else {
      console.error(`[${label}] Error: ${message}`);
    }
  },
  warn: (label: string, message: string) => {
    if (isDev) {
      console.warn(`[${label}]`, message);
    }
  },
  info: (label: string, message: string) => {
    if (isDev) {
      console.log(`[${label}]`, message);
    }
  },
};

// Safe error message for users (no internal details)
export const getUserFriendlyErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message.includes("PGRST")) {
      return "Database error. Please try again.";
    }
    if (error.message.includes("Network")) {
      return "Network error. Check your connection.";
    }
    if (isDev) {
      return error.message;
    }
  }
  return "Something went wrong. Please try again.";
};

// Retry logic for failed operations
export const retryAsync = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> => {
  let lastError: unknown;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
};

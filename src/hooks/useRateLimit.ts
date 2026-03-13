import { useState, useEffect, useCallback, useRef } from 'react';
import { RateLimitError } from '@/services/studyhub-api';

/**
 * Shared rate-limit countdown hook.
 * When a RateLimitError is caught, call `triggerRateLimit(error)` to start the countdown.
 * Returns `rateLimitSeconds` (0 = not limited) and `isRateLimited` boolean.
 */
export function useRateLimit() {
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerRateLimit = useCallback((err: unknown) => {
    if (err instanceof RateLimitError) {
      const seconds = err.retryAfterSeconds || 60;
      setRateLimitUntil(Date.now() + seconds * 1000);
      setRateLimitSeconds(seconds);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (!rateLimitUntil) return;

    // Tick every second
    intervalRef.current = setInterval(() => {
      const remaining = Math.ceil((rateLimitUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setRateLimitSeconds(0);
        setRateLimitUntil(null);
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        setRateLimitSeconds(remaining);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [rateLimitUntil]);

  return {
    rateLimitSeconds,
    isRateLimited: rateLimitSeconds > 0,
    triggerRateLimit,
  };
}

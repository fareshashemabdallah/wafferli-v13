import { useCallback, useEffect, useState } from "react";

const PREFIX = "wafferli.v13.";

export function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or blocked (private mode) */
  }
}

/** Hydration-safe persisted state. `ready` is false until browser storage has been read. */
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setValue(readLocal(key, initial));
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        writeLocal(key, v);
        return v;
      });
    },
    [key],
  );
  return [value, set, ready] as const;
}

export function uid() {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const fmtJOD = (n: number) =>
  `${(Number.isFinite(n) ? n : 0).toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 0 })} JOD`;

export function parseAmount(s: string, max = 1_000_000): number | null {
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0 || n > max) return null;
  return Math.round(n * 100) / 100;
}
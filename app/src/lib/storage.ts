import { useCallback, useEffect, useState } from "react";

const PREFIX = import.meta.env.BASE_URL.includes("/preview/") ? "dabberna.preview.v13." : "wafferli.v13.";

export function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const LOCAL_SAVE_FAILED_EVENT = "dabberna:local-save-failed";
export const LOCAL_DATA_UPDATED_EVENT = "dabberna:local-data-updated";

/**
 * A failed browser storage write must never masquerade as a successful save.
 * Returns false and emits one app-wide warning without logging any private data.
 */
export function writeLocal<T>(key: string, value: T): boolean {
  try {
    if (typeof window === "undefined") return false;
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    // Keep separately mounted Today, Money, and Shopping components coherent
    // in the same tab. Emit the key only, never private values.
    queueMicrotask(() => window.dispatchEvent(new CustomEvent(LOCAL_DATA_UPDATED_EVENT, {detail: key})));
    return true;
  } catch {
    // React state updaters may run during render; notify after the commit to
    // avoid updating a separate warning component in another component's render.
    if (typeof window !== "undefined") queueMicrotask(() => {
      window.dispatchEvent(new Event(LOCAL_SAVE_FAILED_EVENT));
    });
    return false;
  }
}

/** Hydration-safe persisted state. `ready` is false until browser storage has been read. */
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setValue(readLocal(key, initial));
    setReady(true);
    const onLocalChange=(event: Event)=>{
      if((event as CustomEvent<string>).detail===key)setValue(readLocal(key,initial));
    };
    const onOtherTab=(event:StorageEvent)=>{
      if(event.key===PREFIX+key)setValue(readLocal(key,initial));
    };
    window.addEventListener(LOCAL_DATA_UPDATED_EVENT,onLocalChange);
    window.addEventListener("storage",onOtherTab);
    return ()=>{
      window.removeEventListener(LOCAL_DATA_UPDATED_EVENT,onLocalChange);
      window.removeEventListener("storage",onOtherTab);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        return writeLocal(key, v) ? v : prev;
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
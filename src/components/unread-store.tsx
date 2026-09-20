"use client";

import { useSyncExternalStore } from "react";

let count = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function bumpUnread() {
  count += 1;
  emit();
}

export function clearUnread() {
  count = 0;
  emit();
}

export function useUnread<T>(selector: (s: { count: number }) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => selector({ count }),
    () => selector({ count: 0 }),
  );
}

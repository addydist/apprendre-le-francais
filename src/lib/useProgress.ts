"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadProgress,
  saveProgress,
  type ProgressState,
} from "./progress";

// React hook that hydrates progress from localStorage on mount and persists
// every update. `ready` avoids SSR/client hydration mismatches.
export function useProgress() {
  const [state, setState] = useState<ProgressState>(() => loadProgress());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadProgress());
    setReady(true);
  }, []);

  const update = useCallback(
    (fn: (prev: ProgressState) => ProgressState) => {
      setState((prev) => {
        const next = fn(prev);
        saveProgress(next);
        return next;
      });
    },
    [],
  );

  return { state, update, ready, setState };
}

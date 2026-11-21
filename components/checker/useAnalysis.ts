"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiResponse } from "@/lib/types";
import { recordCheck } from "@/lib/client/history";

export type AnalysisState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; run: number; response: ApiResponse };

/** Holds the (in-memory only) state of one checker: idle, loading, or a response. */
export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({ status: "idle" });
  const runId = useRef(0);
  const controller = useRef<AbortController | null>(null);

  const run = useCallback(async (call: (signal: AbortSignal) => Promise<ApiResponse>) => {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    const id = ++runId.current;
    setState({ status: "loading" });
    const response = await call(ctrl.signal);
    if (id !== runId.current) return; // a newer run replaced this one
    setState({ status: "done", run: id, response });
    if (response.ok) recordCheck(response.result); // no-op unless the person turned History on
  }, []);

  const reset = useCallback(() => {
    controller.current?.abort();
    runId.current += 1;
    setState({ status: "idle" });
  }, []);

  useEffect(
    () => () => {
      controller.current?.abort();
    },
    [],
  );

  return { state, run, reset, busy: state.status === "loading" };
}

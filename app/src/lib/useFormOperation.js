import { useCallback, useEffect, useRef, useState } from "react";

export function disposeComparison(result) {
  for (const key of ["original", "encoded", "diff"]) {
    if (result?.[key]?.startsWith("blob:")) URL.revokeObjectURL(result[key]);
  }
}

// Each run owns its controller and revision, including replies after unmount.
export function useFormOperation() {
  const current = useRef(null);
  const [stage, setStage] = useState("");
  const cancel = useCallback(() => {
    current.current?.abort();
    current.current = null;
    setStage("");
  }, []);
  useEffect(() => () => { current.current?.abort(); current.current = null; }, []);
  const run = useCallback(async (label, action) => {
    current.current?.abort();
    const controller = new AbortController();
    current.current = controller;
    setStage(label);
    let result;
    try {
      result = await action({
        signal: controller.signal,
        onProgress: (next) => {
          if (current.current === controller && !controller.signal.aborted) setStage(next);
        },
      });
    } catch (error) {
      const publicReadError = ["INPUT_INVALID", "PNG_LIMIT", "READ_FAILED"].includes(error.code);
      result = { ok: false, code: publicReadError ? error.code : "WORKER_FAILED", error: publicReadError ? error.message : "The operation failed. Try again or choose another image." };
    }
    if (current.current !== controller || controller.signal.aborted) {
      disposeComparison(result);
      return null;
    }
    current.current = null;
    setStage("");
    return result;
  }, []);
  return { run, cancel, stage, busy: Boolean(stage) };
}

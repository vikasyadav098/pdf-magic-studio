import { useCallback, useRef, useState } from "react";

export function useHistory<T>(initial: T) {
  const [state, setState] = useState<T>(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);

  const set = useCallback((next: T | ((prev: T) => T), record = true) => {
    setState((prev) => {
      const value = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      if (record) {
        past.current.push(prev);
        if (past.current.length > 100) past.current.shift();
        future.current = [];
      }
      return value;
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      const p = past.current.pop();
      if (p === undefined) return prev;
      future.current.push(prev);
      return p;
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      const f = future.current.pop();
      if (f === undefined) return prev;
      past.current.push(prev);
      return f;
    });
  }, []);

  const reset = useCallback((value: T) => {
    past.current = [];
    future.current = [];
    setState(value);
  }, []);

  return { state, set, undo, redo, reset };
}

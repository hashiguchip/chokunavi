import { useEffect, useRef, useState } from "react";

type Options = {
  idleMs?: number;
  initialActiveMs?: number;
};

const DEFAULT_IDLE_MS = 700;
const DEFAULT_INITIAL_ACTIVE_MS = 1800;

export function useScrollActivity({
  idleMs = DEFAULT_IDLE_MS,
  initialActiveMs = DEFAULT_INITIAL_ACTIVE_MS,
}: Options = {}) {
  const [active, setActive] = useState(initialActiveMs > 0);
  const activeRef = useRef(active);
  const idleTimerRef = useRef<number | null>(null);
  const initialTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const clearIdleTimer = () => {
      if (!idleTimerRef.current) return;
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    };

    const clearInitialTimer = () => {
      if (!initialTimerRef.current) return;
      window.clearTimeout(initialTimerRef.current);
      initialTimerRef.current = null;
    };

    const setActiveState = (nextActive: boolean) => {
      if (activeRef.current === nextActive) return;
      activeRef.current = nextActive;
      setActive(nextActive);
    };

    const scheduleIdleHide = () => {
      clearIdleTimer();
      idleTimerRef.current = window.setTimeout(() => {
        idleTimerRef.current = null;
        setActiveState(false);
      }, idleMs);
    };

    const handleScroll = () => {
      clearInitialTimer();
      setActiveState(true);
      scheduleIdleHide();
    };

    setActiveState(initialActiveMs > 0);

    if (initialActiveMs > 0) {
      initialTimerRef.current = window.setTimeout(() => {
        initialTimerRef.current = null;
        setActiveState(false);
      }, initialActiveMs);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearIdleTimer();
      clearInitialTimer();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [idleMs, initialActiveMs]);

  return active;
}

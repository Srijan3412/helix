import { useState, useCallback, useRef, useEffect } from 'react';
import { ExecutionTraceData } from './types';

export interface UseJourneyAnimationReturn {
  animatedRoute: string | null;
  animationStep: number;
  isPlaying: boolean;
  isPaused: boolean;
  startJourney: (route: string) => void;
  pauseJourney: () => void;
  resumeJourney: () => void;
  stopJourney: () => void;
}

/**
 * Phase 5: Transit Journey & Trace Animation Hook
 * Manages step-by-step route simulation:
 * - Sequential station arrival lighting
 * - Edge transit animation
 * - Play / Pause / Resume / Stop state management
 */
export function useJourneyAnimation(executionTraces: ExecutionTraceData[]): UseJourneyAnimationReturn {
  const [animatedRoute, setAnimatedRoute] = useState<string | null>(null);
  const [animationStep, setAnimationStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopJourney = useCallback(() => {
    clearTimer();
    setAnimatedRoute(null);
    setAnimationStep(0);
    setIsPlaying(false);
    setIsPaused(false);
  }, [clearTimer]);

  const stepForward = useCallback((trace: ExecutionTraceData) => {
    setAnimationStep((prevStep) => {
      const nextStep = prevStep + 1;
      if (nextStep >= (trace.chain?.length || 0)) {
        clearTimer();
        setTimeout(() => {
          stopJourney();
        }, 1200);
        return prevStep;
      }
      return nextStep;
    });
  }, [clearTimer, stopJourney]);

  const startJourney = useCallback(
    (route: string) => {
      clearTimer();
      const trace = executionTraces.find((t) => t.route === route);
      if (!trace || !trace.chain || trace.chain.length === 0) return;

      setAnimatedRoute(route);
      setAnimationStep(0);
      setIsPlaying(true);
      setIsPaused(false);

      timerRef.current = setInterval(() => {
        stepForward(trace);
      }, 850);
    },
    [clearTimer, executionTraces, stepForward]
  );

  const pauseJourney = useCallback(() => {
    clearTimer();
    setIsPaused(true);
  }, [clearTimer]);

  const resumeJourney = useCallback(() => {
    if (!animatedRoute) return;
    const trace = executionTraces.find((t) => t.route === animatedRoute);
    if (!trace) return;

    setIsPaused(false);
    timerRef.current = setInterval(() => {
      stepForward(trace);
    }, 850);
  }, [animatedRoute, executionTraces, stepForward]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    animatedRoute,
    animationStep,
    isPlaying,
    isPaused,
    startJourney,
    pauseJourney,
    resumeJourney,
    stopJourney
  };
}

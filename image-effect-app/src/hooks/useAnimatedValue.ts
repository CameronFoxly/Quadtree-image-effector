import { useCallback, useEffect, useRef } from 'react';

type EasingFunction = (t: number) => number;

/**
 * Cubic bezier implementation
 * @param x1 First control point x
 * @param y1 First control point y
 * @param x2 Second control point x
 * @param y2 Second control point y
 */
const cubicBezier = (x1: number, y1: number, x2: number, y2: number): EasingFunction => {
  return (t: number): number => {
    if (t === 0 || t === 1) return t;

    let start = 0;
    let end = 1;
    
    // Binary search to find t parameter
    for (let i = 0; i < 10; i++) {
      const currentT = (start + end) / 2;
      const x = 3 * currentT * (1 - currentT) ** 2 * x1 +
                3 * currentT ** 2 * (1 - currentT) * x2 +
                currentT ** 3;
                
      if (Math.abs(x - t) < 0.001) {
        const y = 3 * currentT * (1 - currentT) ** 2 * y1 +
                 3 * currentT ** 2 * (1 - currentT) * y2 +
                 currentT ** 3;
        return y;
      }
      
      if (x < t) {
        start = currentT;
      } else {
        end = currentT;
      }
    }
    
    // Fallback
    return t;
  };
};

interface AnimationConfig {
  duration?: number;
  easing?: EasingFunction;
}

const defaultConfig: Required<AnimationConfig> = {
  duration: 300,
  easing: cubicBezier(0, 0, 0.2, 1)
};

/**
 * Hook for animating numeric values with configurable easing and duration
 * @param value Current value
 * @param onChange Callback for value updates
 * @param config Animation configuration
 */
export const useAnimatedValue = (
  value: number,
  onChange: (value: number) => void,
  config: AnimationConfig = {}
) => {
  const { duration, easing } = { ...defaultConfig, ...config };
  const animationRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(0);
  const startValueRef = useRef<number>(value);
  const targetValueRef = useRef<number>(value);

  // Cleanup function to cancel animation
  const cancelAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
  }, []);

  // Animation frame update function
  const updateValue = useCallback((currentTime: number) => {
    const elapsed = currentTime - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);
    
    // Apply easing to the progress
    const easedProgress = easing(progress);
    
    // Calculate the new value
    const newValue = startValueRef.current + 
      (targetValueRef.current - startValueRef.current) * easedProgress;
    
    // Update the value
    onChange(newValue);
    
    // Continue animation if not complete
    if (progress < 1) {
      animationRef.current = requestAnimationFrame(updateValue);
    }
  }, [duration, easing, onChange]);

  // Main animation function
  const animate = useCallback((targetValue: number) => {
    // Cancel any existing animation
    cancelAnimation();
    
    // Set up new animation
    startTimeRef.current = performance.now();
    startValueRef.current = value;
    targetValueRef.current = targetValue;
    
    // Start the animation
    animationRef.current = requestAnimationFrame(updateValue);
  }, [value, updateValue, cancelAnimation]);

  // Cleanup on unmount or when dependencies change
  useEffect(() => {
    return cancelAnimation;
  }, [cancelAnimation]);

  return animate;
}; 
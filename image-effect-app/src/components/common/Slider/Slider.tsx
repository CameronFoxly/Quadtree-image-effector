import React, { useCallback, useRef, useState, ChangeEvent } from 'react';
import styles from './Slider.module.css';
import { useAnimatedValue } from '../../../hooks/useAnimatedValue';

interface SliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  label?: string;
  className?: string;
  displayPrecision?: number;
}

const createCubicBezier = (x1: number, y1: number, x2: number, y2: number) => {
  return (t: number): number => {
    if (t === 0 || t === 1) return t;
    let start = 0;
    let end = 1;
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
      if (x < t) start = currentT;
      else end = currentT;
    }
    return t;
  };
};

export const Slider: React.FC<SliderProps> = ({
  min,
  max,
  value,
  onChange,
  step = 1,
  label,
  className,
  displayPrecision = 0
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragTimeoutRef = useRef<number | undefined>(undefined);
  
  const animate = useAnimatedValue(value, onChange, {
    duration: isDragging ? 100 : 300,
    easing: isDragging 
      ? createCubicBezier(0, 0.2, 0.2, 1)  // Fast easing for dragging
      : createCubicBezier(0, 0, 0.2, 1)    // Default easing for clicking
  });

  const handleDragStart = useCallback((_e: React.MouseEvent) => {
    // Clear any existing timeout
    if (dragTimeoutRef.current) {
      window.clearTimeout(dragTimeoutRef.current);
    }
    // Set a timeout to determine if this is a drag or click
    dragTimeoutRef.current = window.setTimeout(() => {
      setIsDragging(true);
    }, 150); // 150ms delay before considering it a drag
  }, []);

  const handleDragEnd = useCallback((_e: React.MouseEvent) => {
    // Clear the timeout if it hasn't triggered yet
    if (dragTimeoutRef.current) {
      window.clearTimeout(dragTimeoutRef.current);
    }
    setIsDragging(false);
  }, []);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    animate(Number(e.target.value));
  }, [animate]);

  const calculateValueFromPosition = useCallback((clientX: number) => {
    if (!trackRef.current) return value;

    const rect = trackRef.current.getBoundingClientRect();
    const percentage = (clientX - rect.left) / rect.width;
    const rawValue = min + (max - min) * percentage;
    
    // Clamp value between min and max
    const clampedValue = Math.min(Math.max(rawValue, min), max);
    
    // Apply step if provided
    if (step) {
      return Math.round(clampedValue / step) * step;
    }
    
    return clampedValue;
  }, [min, max, step, value]);

  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (!isDragging) {  // Only handle click if not dragging
      const targetValue = calculateValueFromPosition(e.clientX);
      animate(targetValue);
    }
  }, [calculateValueFromPosition, animate, isDragging]);

  // Calculate slider position percentage for styling
  const position = ((value - min) / (max - min)) * 100;

  // Round the display value based on precision
  const displayValue = Number(value.toFixed(displayPrecision));

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {label && <div className={styles.label}>{label}</div>}
      <div className={styles.sliderContainer}>
        <div 
          ref={trackRef}
          className={styles.sliderTrack}
          onClick={handleTrackClick}
          style={{
            '--slider-position': `${position}%`
          } as React.CSSProperties}
        >
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onChange={handleChange}
            className={styles.rangeInput}
          />
        </div>
        <input
          type="number"
          value={displayValue}
          onChange={(e) => {
            const newValue = Number(e.target.value);
            if (!isNaN(newValue)) {
              animate(Math.min(Math.max(newValue, min), max));
            }
          }}
          className={styles.numberInput}
        />
      </div>
    </div>
  );
}; 
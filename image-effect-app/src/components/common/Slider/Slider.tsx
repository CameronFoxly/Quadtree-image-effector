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
  const [isTyping, setIsTyping] = useState(false);
  const [typedValue, setTypedValue] = useState('');
  const [lastChangeWasTyped, setLastChangeWasTyped] = useState(false);
  const dragStartPosRef = useRef<number | null>(null);
  const hasMovedThresholdRef = useRef(false);
  
  const animate = useAnimatedValue(value, onChange, {
    duration: 300,
    easing: createCubicBezier(0, 0, 0.2, 1)
  });

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

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    dragStartPosRef.current = e.clientX;
    hasMovedThresholdRef.current = false;
    setIsDragging(true);
    setLastChangeWasTyped(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleDragEnd);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      // Only check threshold once at the start of dragging
      if (!hasMovedThresholdRef.current && dragStartPosRef.current !== null) {
        const moveDistance = Math.abs(e.clientX - dragStartPosRef.current);
        if (moveDistance > 5) {
          hasMovedThresholdRef.current = true;
        }
      }

      const newValue = calculateValueFromPosition(e.clientX);
      if (hasMovedThresholdRef.current) {
        // If we've moved past threshold, update directly
        onChange(newValue);
      } else {
        // If we haven't moved much, treat it like a click
        animate(newValue);
      }
    }
  }, [isDragging, onChange, animate, calculateValueFromPosition]);

  const handleDragEnd = useCallback(() => {
    dragStartPosRef.current = null;
    hasMovedThresholdRef.current = false;
    setIsDragging(false);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleDragEnd);
  }, [handleMouseMove]);

  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (!isDragging) {
      setLastChangeWasTyped(false);
      const targetValue = calculateValueFromPosition(e.clientX);
      animate(targetValue);
    }
  }, [calculateValueFromPosition, animate, isDragging]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (isDragging && hasMovedThresholdRef.current) {
      onChange(newValue);
    } else {
      setLastChangeWasTyped(false);
      animate(newValue);
    }
  }, [animate, onChange, isDragging]);

  const handleNumberInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setTypedValue(e.target.value);
    setIsTyping(true);
  }, []);

  const applyTypedValue = useCallback(() => {
    const newValue = Number(typedValue);
    if (!isNaN(newValue)) {
      const clampedValue = Math.min(Math.max(newValue, min), max);
      setLastChangeWasTyped(true);
      animate(clampedValue);
    }
    setIsTyping(false);
  }, [typedValue, min, max, animate]);

  const handleNumberInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyTypedValue();
    } else if (e.key === 'Escape') {
      setIsTyping(false);
      setLastChangeWasTyped(false);
    }
  }, [applyTypedValue]);

  // Calculate slider position percentage for styling
  const position = ((value - min) / (max - min)) * 100;

  // Determine what value to display
  const displayValue = isTyping 
    ? typedValue 
    : lastChangeWasTyped 
      ? Number(typedValue || value).toFixed(displayPrecision)
      : Number(value).toFixed(displayPrecision);

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
            onChange={handleInputChange}
            className={styles.rangeInput}
          />
        </div>
        <input
          type="number"
          value={displayValue}
          onChange={handleNumberInputChange}
          onBlur={applyTypedValue}
          onKeyDown={handleNumberInputKeyDown}
          className={styles.numberInput}
        />
      </div>
    </div>
  );
}; 
import React from 'react';
import styles from './Slider.module.css';
import { Label } from '../Label/Label';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  label?: string;
  onChange: (value: number) => void;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 1,
  label,
  onChange,
  className = ''
}) => {
  const position = ((value - min) / (max - min)) * 100;

  return (
    <div className={`${styles.container} ${className}`}>
      {label && <Label>{label}</Label>}
      <div className={styles.sliderContainer}>
        <div 
          className={styles.sliderTrack}
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
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="input-base"
        />
      </div>
    </div>
  );
};

export default Slider; 
import React, { useState } from 'react';
import styles from './EffectControls.module.css';

interface ColorInputProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const EyedropperIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M13.2 2.8c-.3-.3-.7-.3-1 0L9.7 5.3 9 4.6c-.2-.2-.5-.2-.7 0-.2.2-.2.5 0 .7l.7.7-4.5 4.5c-.3.3-.5.7-.5 1.1v1.7c0 .3.2.5.5.5h1.7c.4 0 .8-.2 1.1-.5l4.5-4.5.7.7c.2.2.5.2.7 0 .2-.2.2-.5 0-.7l-.7-.7 2.5-2.5c.3-.3.3-.7 0-1l-1.8-1.8z" fill="currentColor"/>
  </svg>
);

export default function ColorInput({ value, onChange, label }: ColorInputProps) {
  const [isEyedropping, setIsEyedropping] = useState(false);

  const handleEyedropper = async () => {
    if (!window.EyeDropper) {
      console.warn('Eyedropper API not supported in this browser');
      return;
    }

    try {
      setIsEyedropping(true);
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      onChange(result.sRGBHex);
    } catch (e) {
      console.log('User canceled the eyedropper');
    } finally {
      setIsEyedropping(false);
    }
  };

  return (
    <div className={styles.colorInputContainer}>
      {label && <label className={styles.colorInputLabel}>{label}</label>}
      <div className={styles.colorInputWrapper}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={styles.colorPicker}
        />
        <button
          onClick={handleEyedropper}
          className={`${styles.eyedropperButton} ${isEyedropping ? styles.active : ''}`}
          title="Pick color from screen"
        >
          <EyedropperIcon />
        </button>
      </div>
    </div>
  );
} 
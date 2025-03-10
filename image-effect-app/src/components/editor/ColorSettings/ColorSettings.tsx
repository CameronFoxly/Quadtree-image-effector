import React from 'react';
import { Section } from '../../common/Section/Section';
import { ColorInput } from '../../common/ColorInput/ColorInput';
import { Slider } from '../../common/Slider/Slider';
import { Label } from '../../common/Label/Label';
import styles from './ColorSettings.module.css';

type BlendMode = 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 
                 'color-burn' | 'color-dodge' | 'soft-light' | 'hard-light' | 'color';

interface ColorSettingsProps {
  fillColor: string;
  onFillColorChange: (color: string) => void;
  blendMode: BlendMode;
  onBlendModeChange: (mode: BlendMode) => void;
  tintOpacity: number;
  onTintOpacityChange: (opacity: number) => void;
}

export const ColorSettings: React.FC<ColorSettingsProps> = ({
  fillColor,
  onFillColorChange,
  blendMode,
  onBlendModeChange,
  tintOpacity,
  onTintOpacityChange
}) => {
  const blendModes: BlendMode[] = [
    'multiply', 'screen', 'overlay', 'darken', 'lighten',
    'color-burn', 'color-dodge', 'soft-light', 'hard-light', 'color'
  ];

  return (
    <Section title="Color overlay">
      <ColorInput
        label="Fill Color"
        value={fillColor}
        onChange={onFillColorChange}
      />
      <div className={styles.selectContainer}>
        <Label>Blend Mode</Label>
        <div className={styles.selectWrapper}>
          <select
            value={blendMode}
            onChange={(e) => onBlendModeChange(e.target.value as BlendMode)}
            className="input-base"
          >
            {blendModes.map(mode => (
              <option key={mode} value={mode}>
                {mode.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Slider
        label="Opacity"
        value={tintOpacity}
        min={0}
        max={100}
        onChange={onTintOpacityChange}
      />
    </Section>
  );
};

export default ColorSettings; 
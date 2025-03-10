import React from 'react';
import { Section } from '../../common/Section/Section';
import { ColorInput } from '../../common/ColorInput/ColorInput';
import { Slider } from '../../common/Slider/Slider';

interface GridSettingsProps {
  outlineColor: string;
  onOutlineColorChange: (color: string) => void;
  outlineWidth: number;
  onOutlineWidthChange: (width: number) => void;
}

export const GridSettings: React.FC<GridSettingsProps> = ({
  outlineColor,
  onOutlineColorChange,
  outlineWidth,
  onOutlineWidthChange
}) => {
  return (
    <Section title="Grid settings">
      <ColorInput
        label="Outline Color"
        value={outlineColor}
        onChange={onOutlineColorChange}
      />
      <Slider
        label="Outline Width"
        value={outlineWidth}
        min={0}
        max={5}
        step={0.1}
        onChange={onOutlineWidthChange}
      />
    </Section>
  );
};

export default GridSettings; 
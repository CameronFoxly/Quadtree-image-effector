import React from 'react';
import { Section } from '../../common/Section/Section';
import { Slider } from '../../common/Slider/Slider';

interface QuadtreeSettingsProps {
  varianceThreshold: number;
  onVarianceThresholdChange: (value: number) => void;
  maxLevel: number;
  onMaxLevelChange: (value: number) => void;
}

export const QuadtreeSettings: React.FC<QuadtreeSettingsProps> = ({
  varianceThreshold,
  onVarianceThresholdChange,
  maxLevel,
  onMaxLevelChange
}) => {
  return (
    <Section title="Quadtree settings">
      <Slider
        label="Variance threshold"
        value={varianceThreshold}
        min={0}
        max={2000}
        onChange={onVarianceThresholdChange}
      />
      <Slider
        label="Max level"
        value={maxLevel}
        min={1}
        max={10}
        onChange={onMaxLevelChange}
      />
    </Section>
  );
};

export default QuadtreeSettings; 
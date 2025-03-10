import React from 'react';
import { Section } from '../../common/Section/Section';
import { Button } from '../../common/Button/Button';
import { Slider } from '../../common/Slider/Slider';
import styles from './BrushControls.module.css';

type RevealMode = 'image' | 'grid' | 'conceal' | 'remove-outlines' | 'add-color' | 'remove-color';

interface BrushControlsProps {
  revealMode: RevealMode;
  onRevealModeChange: (mode: RevealMode) => void;
  brushRadius: number;
  onBrushRadiusChange: (radius: number) => void;
}

export const BrushControls: React.FC<BrushControlsProps> = ({
  revealMode,
  onRevealModeChange,
  brushRadius,
  onBrushRadiusChange
}) => {
  return (
    <>
      <Section title="Brush mode">
        <div className="grid-2col">
          <Button
            active={revealMode === 'image'}
            onClick={() => onRevealModeChange('image')}
          >
            Add image
          </Button>
          <Button
            active={revealMode === 'conceal'}
            onClick={() => onRevealModeChange('conceal')}
          >
            Remove image
          </Button>
          <Button
            active={revealMode === 'grid'}
            onClick={() => onRevealModeChange('grid')}
          >
            Add grid
          </Button>
          <Button
            active={revealMode === 'remove-outlines'}
            onClick={() => onRevealModeChange('remove-outlines')}
          >
            Remove grid
          </Button>
          <Button
            active={revealMode === 'add-color'}
            onClick={() => onRevealModeChange('add-color')}
          >
            Add color
          </Button>
          <Button
            active={revealMode === 'remove-color'}
            onClick={() => onRevealModeChange('remove-color')}
          >
            Remove color
          </Button>
        </div>
      </Section>

      <Section>
        <div className={styles.brushPreviewContainer}>
          <div 
            className={styles.brushPreview}
            style={{
              width: `${brushRadius * 2}px`,
              height: `${brushRadius * 2}px`
            }}
          />
        </div>
        <Slider
          label="Brush size"
          value={brushRadius}
          min={1}
          max={400}
          onChange={onBrushRadiusChange}
        />
      </Section>
    </>
  );
};

export default BrushControls; 
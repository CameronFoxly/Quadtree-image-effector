import styles from './EffectControls.module.css';

interface EffectControlsProps {
  varianceThreshold: number;
  onVarianceThresholdChange: (value: number) => void;
  maxLevel: number;
  onMaxLevelChange: (value: number) => void;
  outlineColor: string;
  onOutlineColorChange: (color: string) => void;
  outlineWidth: number;
  onOutlineWidthChange: (value: number) => void;
  brushRadius: number;
  onBrushRadiusChange: (value: number) => void;
  revealMode: 'image' | 'grid';
  onRevealModeChange: (mode: 'image' | 'grid') => void;
}

export default function EffectControls({
  varianceThreshold,
  onVarianceThresholdChange,
  maxLevel,
  onMaxLevelChange,
  outlineColor,
  onOutlineColorChange,
  outlineWidth,
  onOutlineWidthChange,
  brushRadius,
  onBrushRadiusChange,
  revealMode,
  onRevealModeChange,
}: EffectControlsProps) {
  return (
    <div className={styles.controls}>
      <div className={styles.controlGroup}>
        <label className={styles.label}>
          Brush Mode
        </label>
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeButton} ${revealMode === 'image' ? styles.modeButtonActive : ''}`}
            onClick={() => onRevealModeChange('image')}
          >
            Reveal image
          </button>
          <button
            className={`${styles.modeButton} ${revealMode === 'grid' ? styles.modeButtonActive : ''}`}
            onClick={() => onRevealModeChange('grid')}
          >
            Add outlines
          </button>
        </div>
      </div>

      <div className={styles.controlGroup}>
        <label className={styles.label}>Variance Threshold</label>
        <div className={styles.sliderContainer}>
          <input
            type="range"
            min="0"
            max="2000"
            value={varianceThreshold}
            onChange={(e) => onVarianceThresholdChange(Number(e.target.value))}
            className={styles.slider}
          />
          <input
            type="number"
            value={varianceThreshold}
            onChange={(e) => onVarianceThresholdChange(Number(e.target.value))}
            className={styles.valueInput}
            min="0"
            max="2000"
          />
        </div>
      </div>

      <div className={styles.controlGroup}>
        <label className={styles.label}>Max Subdivision Level</label>
        <div className={styles.sliderContainer}>
          <input
            type="range"
            min="1"
            max="8"
            value={maxLevel}
            onChange={(e) => onMaxLevelChange(Number(e.target.value))}
            className={styles.slider}
          />
          <input
            type="number"
            value={maxLevel}
            onChange={(e) => onMaxLevelChange(Number(e.target.value))}
            className={styles.valueInput}
            min="1"
            max="8"
          />
        </div>
      </div>

      <div className={styles.controlGroup}>
        <label className={styles.label}>Brush Size</label>
        <div className={styles.sliderContainer}>
          <input
            type="range"
            min="5"
            max="50"
            value={brushRadius}
            onChange={(e) => onBrushRadiusChange(Number(e.target.value))}
            className={styles.slider}
          />
          <input
            type="number"
            value={brushRadius * 2}
            onChange={(e) => onBrushRadiusChange(Number(e.target.value) / 2)}
            className={styles.valueInput}
            min="10"
            max="100"
            step="2"
          />
        </div>
      </div>

      <div className={styles.controlGroup}>
        <label className={styles.label}>Outline Color</label>
        <input
          type="color"
          value={outlineColor}
          onChange={(e) => onOutlineColorChange(e.target.value)}
          className={styles.colorPicker}
        />
      </div>

      <div className={styles.controlGroup}>
        <label className={styles.label}>Outline Width</label>
        <div className={styles.sliderContainer}>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={outlineWidth}
            onChange={(e) => onOutlineWidthChange(Number(e.target.value))}
            className={styles.slider}
          />
          <input
            type="number"
            value={outlineWidth}
            onChange={(e) => onOutlineWidthChange(Number(e.target.value))}
            className={styles.valueInput}
            min="0"
            max="3"
            step="0.1"
          />
        </div>
      </div>
    </div>
  );
} 
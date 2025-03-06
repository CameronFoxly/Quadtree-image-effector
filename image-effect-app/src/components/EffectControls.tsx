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
          Reveal Mode
        </label>
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeButton} ${revealMode === 'image' ? styles.modeButtonActive : ''}`}
            onClick={() => onRevealModeChange('image')}
          >
            Image
          </button>
          <button
            className={`${styles.modeButton} ${revealMode === 'grid' ? styles.modeButtonActive : ''}`}
            onClick={() => onRevealModeChange('grid')}
          >
            Grid
          </button>
        </div>
      </div>

      <div className={styles.controlGroup}>
        <label className={styles.label}>
          Variance Threshold
          <span className={styles.value}>{varianceThreshold}</span>
        </label>
        <input
          type="range"
          min="0"
          max="2000"
          value={varianceThreshold}
          onChange={(e) => onVarianceThresholdChange(Number(e.target.value))}
          className={styles.slider}
        />
      </div>

      <div className={styles.controlGroup}>
        <label className={styles.label}>
          Max Subdivision Level
          <span className={styles.value}>{maxLevel}</span>
        </label>
        <input
          type="range"
          min="1"
          max="8"
          value={maxLevel}
          onChange={(e) => onMaxLevelChange(Number(e.target.value))}
          className={styles.slider}
        />
      </div>

      <div className={styles.controlGroup}>
        <label className={styles.label}>
          Brush Size
          <span className={styles.value}>{brushRadius * 2}px</span>
        </label>
        <input
          type="range"
          min="5"
          max="50"
          value={brushRadius}
          onChange={(e) => onBrushRadiusChange(Number(e.target.value))}
          className={styles.slider}
        />
      </div>

      <div className={styles.controlGroup}>
        <label className={styles.label}>
          Outline Color
        </label>
        <input
          type="color"
          value={outlineColor}
          onChange={(e) => onOutlineColorChange(e.target.value)}
          className={styles.colorPicker}
        />
      </div>

      <div className={styles.controlGroup}>
        <label className={styles.label}>
          Outline Width
          <span className={styles.value}>{outlineWidth.toFixed(1)}px</span>
        </label>
        <input
          type="range"
          min="0"
          max="3"
          step="0.1"
          value={outlineWidth}
          onChange={(e) => onOutlineWidthChange(Number(e.target.value))}
          className={styles.slider}
        />
      </div>
    </div>
  );
} 
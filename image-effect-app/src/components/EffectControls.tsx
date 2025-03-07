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
  revealMode: 'image' | 'grid' | 'conceal' | 'remove-outlines';
  onRevealModeChange: (mode: 'image' | 'grid' | 'conceal' | 'remove-outlines') => void;
  onReset: () => void;
  onUploadNewImage: () => void;
  onDownloadImage: () => void;
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
  onReset,
  onUploadNewImage,
  onDownloadImage,
}: EffectControlsProps) {
  return (
    <div className={styles.controls}>
      <div className={styles.controlGroup}>
        <label className={styles.label}>
          Brush Mode
        </label>
        <div className={styles.modeToggle}>
          <div className={styles.modeRow}>
            <button
              className={`${styles.modeButton} ${revealMode === 'image' ? styles.modeButtonActive : ''}`}
              onClick={() => onRevealModeChange('image')}
            >
              Reveal image
            </button>
            <button
              className={`${styles.modeButton} ${revealMode === 'conceal' ? styles.modeButtonActive : ''}`}
              onClick={() => onRevealModeChange('conceal')}
            >
              Conceal image
            </button>
          </div>
          <div className={styles.modeRow}>
            <button
              className={`${styles.modeButton} ${revealMode === 'grid' ? styles.modeButtonActive : ''}`}
              onClick={() => onRevealModeChange('grid')}
            >
              Add outlines
            </button>
            <button
              className={`${styles.modeButton} ${revealMode === 'remove-outlines' ? styles.modeButtonActive : ''}`}
              onClick={() => onRevealModeChange('remove-outlines')}
            >
              Remove outlines
            </button>
          </div>
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

      <div className={styles.buttonGroup}>
        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={onReset}
        >
          Reset
        </button>
        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={onUploadNewImage}
        >
          Upload new image
        </button>
        <button
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={onDownloadImage}
        >
          Download
        </button>
      </div>
    </div>
  );
} 
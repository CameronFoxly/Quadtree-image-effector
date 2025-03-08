import React from 'react';
import styles from './EffectControls.module.css';

type RevealMode = 'image' | 'grid' | 'conceal' | 'remove-outlines' | 'add-color' | 'remove-color';
type BlendMode = 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 
                 'color-burn' | 'color-dodge' | 'soft-light' | 'hard-light' | 'color';

interface EffectControlsProps {
  varianceThreshold: number;
  onVarianceThresholdChange: (value: number) => void;
  maxLevel: number;
  onMaxLevelChange: (value: number) => void;
  outlineColor: string;
  onOutlineColorChange: (color: string) => void;
  outlineWidth: number;
  onOutlineWidthChange: (width: number) => void;
  brushRadius: number;
  onBrushRadiusChange: (radius: number) => void;
  revealMode: RevealMode;
  onRevealModeChange: (mode: RevealMode) => void;
  fillColor: string;
  onFillColorChange: (color: string) => void;
  blendMode: BlendMode;
  onBlendModeChange: (mode: BlendMode) => void;
  tintOpacity: number;
  onTintOpacityChange: (opacity: number) => void;
  onReset: () => void;
  onUploadNewImage: () => void;
  onDownloadImage: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
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
  fillColor,
  onFillColorChange,
  blendMode,
  onBlendModeChange,
  tintOpacity,
  onTintOpacityChange,
  onReset,
  onUploadNewImage,
  onDownloadImage,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}: EffectControlsProps) {
  const blendModes: BlendMode[] = [
    'multiply', 'screen', 'overlay', 'darken', 'lighten',
    'color-burn', 'color-dodge', 'soft-light', 'hard-light', 'color'
  ];

  return (
    <div className={styles.controls}>
      <div className={styles.section}>
        <h3>Mode</h3>
        <div className={styles.modeGrid}>
          <button
            className={`${styles.modeButton} ${revealMode === 'image' ? styles.active : ''}`}
            onClick={() => onRevealModeChange('image')}
          >
            Reveal Image
          </button>
          <button
            className={`${styles.modeButton} ${revealMode === 'conceal' ? styles.active : ''}`}
            onClick={() => onRevealModeChange('conceal')}
          >
            Conceal Image
          </button>
          <button
            className={`${styles.modeButton} ${revealMode === 'grid' ? styles.active : ''}`}
            onClick={() => onRevealModeChange('grid')}
          >
            Add Grid
          </button>
          <button
            className={`${styles.modeButton} ${revealMode === 'remove-outlines' ? styles.active : ''}`}
            onClick={() => onRevealModeChange('remove-outlines')}
          >
            Remove Grid
          </button>
          <button
            className={`${styles.modeButton} ${revealMode === 'add-color' ? styles.active : ''}`}
            onClick={() => onRevealModeChange('add-color')}
          >
            Add Color
          </button>
          <button
            className={`${styles.modeButton} ${revealMode === 'remove-color' ? styles.active : ''}`}
            onClick={() => onRevealModeChange('remove-color')}
          >
            Remove Color
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Quadtree Settings</h3>
        <div className={styles.control}>
          <label>Variance Threshold</label>
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="0"
              max="2000"
              value={varianceThreshold}
              onChange={(e) => onVarianceThresholdChange(Number(e.target.value))}
            />
            <input
              type="number"
              value={varianceThreshold}
              onChange={(e) => onVarianceThresholdChange(Number(e.target.value))}
              className={styles.numberInput}
            />
          </div>
        </div>

        <div className={styles.control}>
          <label>Max Level</label>
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="1"
              max="10"
              value={maxLevel}
              onChange={(e) => onMaxLevelChange(Number(e.target.value))}
            />
            <input
              type="number"
              value={maxLevel}
              onChange={(e) => onMaxLevelChange(Number(e.target.value))}
              className={styles.numberInput}
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Grid Settings</h3>
        <div className={styles.control}>
          <label>Outline Color</label>
          <input
            type="color"
            value={outlineColor}
            onChange={(e) => onOutlineColorChange(e.target.value)}
          />
        </div>

        <div className={styles.control}>
          <label>Outline Width</label>
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={outlineWidth}
              onChange={(e) => onOutlineWidthChange(Number(e.target.value))}
            />
            <input
              type="number"
              value={outlineWidth}
              onChange={(e) => onOutlineWidthChange(Number(e.target.value))}
              className={styles.numberInput}
              step="0.1"
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Color Overlay</h3>
        <div className={styles.control}>
          <label>Fill Color</label>
          <input
            type="color"
            value={fillColor}
            onChange={(e) => onFillColorChange(e.target.value)}
          />
        </div>

        <div className={styles.control}>
          <label>Blend Mode</label>
          <select
            value={blendMode}
            onChange={(e) => onBlendModeChange(e.target.value as BlendMode)}
            className={styles.select}
          >
            {blendModes.map(mode => (
              <option key={mode} value={mode}>
                {mode.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.control}>
          <label>Opacity</label>
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="0"
              max="100"
              value={tintOpacity}
              onChange={(e) => onTintOpacityChange(Number(e.target.value))}
            />
            <input
              type="number"
              value={tintOpacity}
              onChange={(e) => onTintOpacityChange(Number(e.target.value))}
              className={styles.numberInput}
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Brush Size</h3>
        <div className={styles.control}>
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="5"
              max="50"
              value={brushRadius}
              onChange={(e) => onBrushRadiusChange(Number(e.target.value))}
            />
            <input
              type="number"
              value={brushRadius}
              onChange={(e) => onBrushRadiusChange(Number(e.target.value))}
              className={styles.numberInput}
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Actions</h3>
        <div className={styles.buttonGrid}>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={styles.actionButton}
          >
            Undo
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={styles.actionButton}
          >
            Redo
          </button>
          <button onClick={onReset} className={styles.actionButton}>
            Reset
          </button>
          <button onClick={onUploadNewImage} className={styles.actionButton}>
            New Image
          </button>
          <button onClick={onDownloadImage} className={styles.actionButton}>
            Download
          </button>
        </div>
      </div>
    </div>
  );
} 
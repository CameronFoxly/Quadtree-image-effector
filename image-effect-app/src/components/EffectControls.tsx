import React from 'react';
import styles from './EffectControls.module.css';
import ColorInput from './ColorInput';
import { Slider } from './common/Slider/Slider';

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
    <div className={styles.controlsWrapper}>
      <div className={styles.controls}>
        <div className={styles.header}>
          <h1>Quadtree Editor</h1>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Brush mode</h2>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.modeGrid}>
              <button
                className={`${styles.modeButton} ${revealMode === 'image' ? styles.active : ''}`}
                onClick={() => onRevealModeChange('image')}
              >
                Add image
              </button>
              <button
                className={`${styles.modeButton} ${revealMode === 'conceal' ? styles.active : ''}`}
                onClick={() => onRevealModeChange('conceal')}
              >
                Remove image
              </button>
              <button
                className={`${styles.modeButton} ${revealMode === 'grid' ? styles.active : ''}`}
                onClick={() => onRevealModeChange('grid')}
              >
                Add grid
              </button>
              <button
                className={`${styles.modeButton} ${revealMode === 'remove-outlines' ? styles.active : ''}`}
                onClick={() => onRevealModeChange('remove-outlines')}
              >
                Remove grid
              </button>
              <button
                className={`${styles.modeButton} ${revealMode === 'add-color' ? styles.active : ''}`}
                onClick={() => onRevealModeChange('add-color')}
              >
                Add color
              </button>
              <button
                className={`${styles.modeButton} ${revealMode === 'remove-color' ? styles.active : ''}`}
                onClick={() => onRevealModeChange('remove-color')}
              >
                Remove color
              </button>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionContent}>
            <div className={styles.brushPreviewContainer}>
              <div 
                className={styles.brushPreview}
                style={{
                  width: `${brushRadius * 2}px`,
                  height: `${brushRadius * 2}px`
                }}
              />
            </div>
          </div>
          <div className={styles.controlLabel}>Brush size</div>
          <div className={styles.sectionContent}>
            <Slider
              min={1}
              max={400}
              value={brushRadius}
              onChange={onBrushRadiusChange}
              displayPrecision={0}
            />
          </div>
        </div>

        {/* Quadtree Settings - Only show for image reveal/conceal modes */}
        {(revealMode === 'image' || revealMode === 'conceal') && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Quadtree settings</h2>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.controlLabel}>Variance threshold</div>
              <Slider
                min={0}
                max={2000}
                value={varianceThreshold}
                onChange={onVarianceThresholdChange}
                displayPrecision={0}
              />
            </div>

            <div className={styles.sectionContent}>
              <div className={styles.controlLabel}>Max level</div>
              <Slider
                min={1}
                max={10}
                value={maxLevel}
                onChange={onMaxLevelChange}
                displayPrecision={0}
              />
            </div>
          </div>
        )}

        {/* Grid Settings - Only show for grid modes */}
        {(revealMode === 'grid' || revealMode === 'remove-outlines') && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Grid settings</h2>
            </div>
            <div className={styles.sectionContent}>
              <ColorInput
                label="Outline Color"
                value={outlineColor}
                onChange={onOutlineColorChange}
              />
            </div>

            <div className={styles.controlLabel}>Outline Width</div>
            <div className={styles.sectionContent}>
              <Slider
                min={0}
                max={5}
                step={0.1}
                value={outlineWidth}
                onChange={onOutlineWidthChange}
                displayPrecision={1}
              />
            </div>
          </div>
        )}

        {/* Color Overlay Settings - Only show for color modes */}
        {(revealMode === 'add-color' || revealMode === 'remove-color') && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Color overlay</h2>
            </div>
            <div className={styles.sectionContent}>
              <ColorInput
                label="Fill Color"
                value={fillColor}
                onChange={onFillColorChange}
              />
            </div>

            <div className={styles.controlLabel}>Blend Mode</div>
            <div className={styles.sectionContent}>
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

            <div className={styles.controlLabel}>Opacity</div>
            <div className={styles.sectionContent}>
              <Slider
                min={0}
                max={100}
                value={tintOpacity}
                onChange={onTintOpacityChange}
                displayPrecision={0}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className={styles.section}>
          <div className={styles.sectionContent}>
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
              <button
                onClick={onReset}
                className={styles.actionButton}
              >
                Reset
              </button>
              <button
                onClick={onUploadNewImage}
                className={styles.actionButton}
              >
                New Image
              </button>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <button
            onClick={onDownloadImage}
            className={styles.downloadButton}
          >
            Download Image
          </button>
        </div>
      </div>
    </div>
  );
} 
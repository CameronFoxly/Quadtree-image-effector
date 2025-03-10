import React from 'react';
import styles from './EffectControls.module.css';
import { ActionBar } from './editor/ActionBar/ActionBar';
import { BrushControls } from './editor/BrushControls/BrushControls';
import { QuadtreeSettings } from './editor/QuadtreeSettings/QuadtreeSettings';
import { GridSettings } from './editor/GridSettings/GridSettings';
import { ColorSettings } from './editor/ColorSettings/ColorSettings';

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
  return (
    <div className={styles.controlsWrapper}>
      <div className={styles.scrollWrapper}>
        <div className={styles.controls}>
          <div className={styles.header}>
            <h1>Quadtree Editor</h1>
          </div>

          <BrushControls
            revealMode={revealMode}
            onRevealModeChange={onRevealModeChange}
            brushRadius={brushRadius}
            onBrushRadiusChange={onBrushRadiusChange}
          />

          {(revealMode === 'image' || revealMode === 'conceal') && (
            <QuadtreeSettings
              varianceThreshold={varianceThreshold}
              onVarianceThresholdChange={onVarianceThresholdChange}
              maxLevel={maxLevel}
              onMaxLevelChange={onMaxLevelChange}
            />
          )}

          {(revealMode === 'grid' || revealMode === 'remove-outlines') && (
            <GridSettings
              outlineColor={outlineColor}
              onOutlineColorChange={onOutlineColorChange}
              outlineWidth={outlineWidth}
              onOutlineWidthChange={onOutlineWidthChange}
            />
          )}

          {(revealMode === 'add-color' || revealMode === 'remove-color') && (
            <ColorSettings
              fillColor={fillColor}
              onFillColorChange={onFillColorChange}
              blendMode={blendMode}
              onBlendModeChange={onBlendModeChange}
              tintOpacity={tintOpacity}
              onTintOpacityChange={onTintOpacityChange}
            />
          )}

          <ActionBar
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={onUndo}
            onRedo={onRedo}
            onReset={onReset}
            onDownload={onDownloadImage}
          />
        </div>
      </div>
    </div>
  );
} 
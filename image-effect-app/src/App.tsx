import React, { useState, useEffect, useCallback } from 'react'
import ImageUpload from './components/ImageUpload'
import ImagePreview from './components/ImagePreview'
import EffectControls from './components/EffectControls'
import { createQuadTree, renderQuadTree } from './utils/quadtree'
import './App.css'

type RevealMode = 'image' | 'grid';

interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [varianceThreshold, setVarianceThreshold] = useState(50)
  const [maxLevel, setMaxLevel] = useState(6)
  const [outlineColor, setOutlineColor] = useState('#FFFFFF')
  const [outlineWidth, setOutlineWidth] = useState(0.2)
  const [brushRadius, setBrushRadius] = useState(15)
  const [revealMode, setRevealMode] = useState<RevealMode>('image')
  const [imageRemovedRegions, setImageRemovedRegions] = useState<Region[]>([])
  const [gridRemovedRegions, setGridRemovedRegions] = useState<Region[]>([])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        setBrushRadius(prev => Math.min(prev + 10, 50))
      } else if (e.key === '-' || e.key === '_') {
        setBrushRadius(prev => Math.max(prev - 10, 5))
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const handleImageSelect = (file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) return;
    if (file.size === 0) return;

    // Revoke any existing URL to prevent memory leaks
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }

    try {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    } catch (error) {
      // Silently handle error
    }
  }

  const handleDownload = () => {
    if (!imageUrl) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      // Use original image dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the original image at full size
      ctx.drawImage(img, 0, 0);

      // Apply the current quadtree effect
      const quadtree = createQuadTree(
        ctx,
        img.width,
        img.height,
        maxLevel,
        varianceThreshold
      );

      // Create a temporary canvas for original image data
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      tempCtx.drawImage(img, 0, 0);

      if (revealMode === 'image') {
        // In image mode, render the quadtree with outlines for non-removed regions
        renderQuadTree(ctx, quadtree, outlineColor, outlineWidth, gridRemovedRegions);
        
        // Restore original pixels for image-removed regions
        imageRemovedRegions.forEach(region => {
          const regionImageData = tempCtx.getImageData(
            region.x,
            region.y,
            region.width,
            region.height
          );
          ctx.putImageData(regionImageData, region.x, region.y);
        });
      } else {
        // In grid mode, render the quadtree with outlines only for non-removed regions
        renderQuadTree(ctx, quadtree, outlineColor, outlineWidth, gridRemovedRegions);
      }

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'processed-image.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
  }

  return (
    <div className="container">
      <div className="content">
        <main className="main">
          {!imageUrl ? (
            <ImageUpload onImageSelect={handleImageSelect} />
          ) : (
            <>
              <div className="previewSection">
                <ImagePreview
                  imageUrl={imageUrl}
                  effect="quadtree"
                  settings={{
                    varianceThreshold,
                    maxLevel,
                    outlineColor,
                    outlineWidth
                  }}
                  brushRadius={brushRadius}
                  revealMode={revealMode}
                  imageRemovedRegions={imageRemovedRegions}
                  gridRemovedRegions={gridRemovedRegions}
                  onImageRemovedRegionsChange={setImageRemovedRegions}
                  onGridRemovedRegionsChange={setGridRemovedRegions}
                />
              </div>
              <div className="controlsSection">
                <EffectControls
                  varianceThreshold={varianceThreshold}
                  onVarianceThresholdChange={setVarianceThreshold}
                  maxLevel={maxLevel}
                  onMaxLevelChange={setMaxLevel}
                  outlineColor={outlineColor}
                  onOutlineColorChange={setOutlineColor}
                  outlineWidth={outlineWidth}
                  onOutlineWidthChange={setOutlineWidth}
                  brushRadius={brushRadius}
                  onBrushRadiusChange={setBrushRadius}
                  revealMode={revealMode}
                  onRevealModeChange={setRevealMode}
                />
                <div className="buttonGroup">
                  <button
                    className="button buttonSecondary"
                    onClick={() => {
                      setImageRemovedRegions([]);
                      setGridRemovedRegions([]);
                    }}
                  >
                    Reset
                  </button>
                  <button
                    className="button buttonSecondary"
                    onClick={() => setImageUrl(null)}
                  >
                    Upload New Image
                  </button>
                  <button
                    className="button buttonPrimary"
                    onClick={handleDownload}
                  >
                    Download Image
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default App

import { useState, useEffect, useCallback } from 'react'
import ImageUpload from './components/ImageUpload'
import ImagePreview from './components/ImagePreview'
import EffectControls from './components/EffectControls'
import { createQuadTree, renderQuadTree } from './utils/quadtree'
import './App.css'

type RevealMode = 'image' | 'grid' | 'conceal' | 'remove-outlines' | 'add-color' | 'remove-color';

type BlendMode = 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 
                 'color-burn' | 'color-dodge' | 'soft-light' | 'hard-light' | 'color';

interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TintedRegion extends Region {
  color: string;
  blendMode: BlendMode;
  opacity: number;
}

interface HistoryState {
  imageRemovedRegions: Region[];
  gridOutlinedRegions: Region[];
  tintedRegions: TintedRegion[];
}

function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [varianceThreshold, setVarianceThreshold] = useState(1000)
  const [maxLevel, setMaxLevel] = useState(6)
  const [outlineColor, setOutlineColor] = useState('#FFFFFF')
  const [outlineWidth, setOutlineWidth] = useState(0.5)
  const [brushRadius, setBrushRadius] = useState(50)
  const [revealMode, setRevealMode] = useState<RevealMode>('image')
  const [imageRemovedRegions, setImageRemovedRegions] = useState<Region[]>([])
  const [gridOutlinedRegions, setGridOutlinedRegions] = useState<Region[]>([])
  const [tintedRegions, setTintedRegions] = useState<TintedRegion[]>([])
  
  // Tint settings
  const [fillColor, setFillColor] = useState('#00FF00') // Neon green
  const [blendMode, setBlendMode] = useState<BlendMode>('screen')
  const [tintOpacity, setTintOpacity] = useState(100)
  
  // History management
  const [history, setHistory] = useState<HistoryState[]>([{ 
    imageRemovedRegions: [], 
    gridOutlinedRegions: [],
    tintedRegions: []
  }])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0)
  const [isInBatchOperation, setIsInBatchOperation] = useState(false)

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
      // Reset all effects and regions
      setImageRemovedRegions([]);
      setGridOutlinedRegions([]);
      setVarianceThreshold(1000);
      setMaxLevel(6);
      setOutlineColor('#FFFFFF');
      setOutlineWidth(0.5);
      setBrushRadius(50);
      setRevealMode('image');
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

      // Render the quadtree effect
      renderQuadTree(ctx, quadtree, outlineColor, outlineWidth, [], false);

      // Restore original pixels for image-removed regions
      if (imageRemovedRegions.length > 0) {
        imageRemovedRegions.forEach(region => {
          const regionImageData = tempCtx.getImageData(
            region.x,
            region.y,
            region.width,
            region.height
          );
          ctx.putImageData(regionImageData, region.x, region.y);
        });
      }

      // Draw tinted regions
      if (tintedRegions.length > 0) {
        tintedRegions.forEach(region => {
          ctx.save();
          ctx.globalCompositeOperation = region.blendMode;
          ctx.globalAlpha = region.opacity / 100;
          ctx.fillStyle = region.color;
          ctx.fillRect(
            region.x,
            region.y,
            region.width,
            region.height
          );
          ctx.restore();
        });
      }

      // Draw outlines for grid mode regions
      if (gridOutlinedRegions.length > 0 && outlineWidth > 0) {
        gridOutlinedRegions.forEach(region => {
          ctx.strokeStyle = outlineColor;
          ctx.lineWidth = outlineWidth;
          // Apply offset in original image space
          const offset = outlineWidth;
          ctx.strokeRect(
            region.x + offset,
            region.y + offset,
            region.width - (offset * 2),
            region.height - (offset * 2)
          );
        });
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

  // Function to add a new history entry
  const addHistoryEntry = useCallback((
    newImageRegions: Region[], 
    newGridRegions: Region[],
    newTintedRegions: TintedRegion[]
  ) => {
    console.log('addHistoryEntry called');
    console.log('isInBatchOperation:', isInBatchOperation);
    if (isInBatchOperation) return;

    setHistory(prevHistory => {
      console.log('Previous history:', prevHistory);
      console.log('Current index:', currentHistoryIndex);
      
      // Remove any future history entries after current index
      const newHistory = prevHistory.slice(0, currentHistoryIndex + 1);
      
      // Add new state
      const newEntry = {
        imageRemovedRegions: [...newImageRegions],
        gridOutlinedRegions: [...newGridRegions],
        tintedRegions: [...newTintedRegions]
      };
      console.log('Adding new entry:', newEntry);
      newHistory.push(newEntry);

      // Limit history to 50 entries
      if (newHistory.length > 50) {
        newHistory.shift();
        setCurrentHistoryIndex(prev => prev - 1);
      }

      console.log('New history:', newHistory);
      return newHistory;
    });

    setCurrentHistoryIndex(prev => {
      console.log('Updating current index from:', prev, 'to:', prev + 1);
      return prev + 1;
    });
  }, [currentHistoryIndex, isInBatchOperation]);

  // Function to update history and state
  const updateHistoryAndState = useCallback((newIndex: number) => {
    console.log('updateHistoryAndState called with index:', newIndex);
    console.log('Current history:', history);
    const state = history[newIndex];
    console.log('State to apply:', state);
    setCurrentHistoryIndex(newIndex);
    setImageRemovedRegions(state.imageRemovedRegions);
    setGridOutlinedRegions(state.gridOutlinedRegions);
    setTintedRegions(state.tintedRegions);
  }, [history]);

  // Wrap region updates to handle history
  const handleTintedRegionsChange = useCallback((newRegions: TintedRegion[]) => {
    setTintedRegions(newRegions);
    if (!isInBatchOperation) {
      addHistoryEntry(imageRemovedRegions, gridOutlinedRegions, newRegions);
    }
  }, [isInBatchOperation, imageRemovedRegions, gridOutlinedRegions, addHistoryEntry]);

  const handleImageRegionsChange = useCallback((newRegions: Region[]) => {
    setImageRemovedRegions(newRegions);
    if (!isInBatchOperation) {
      addHistoryEntry(newRegions, gridOutlinedRegions, tintedRegions);
    }
  }, [isInBatchOperation, gridOutlinedRegions, tintedRegions, addHistoryEntry]);

  const handleGridRegionsChange = useCallback((newRegions: Region[]) => {
    setGridOutlinedRegions(newRegions);
    if (!isInBatchOperation) {
      addHistoryEntry(imageRemovedRegions, newRegions, tintedRegions);
    }
  }, [isInBatchOperation, imageRemovedRegions, tintedRegions, addHistoryEntry]);

  const handleBatchOperationEnd = useCallback((
    newImageRegions: Region[], 
    newGridRegions: Region[],
    newTintedRegions: TintedRegion[]
  ) => {
    console.log('Batch operation ending');
    setIsInBatchOperation(false);
    setImageRemovedRegions(newImageRegions);
    setGridOutlinedRegions(newGridRegions);
    setTintedRegions(newTintedRegions);
    addHistoryEntry(newImageRegions, newGridRegions, newTintedRegions);
  }, [addHistoryEntry]);

  // Function to handle undo/redo actions
  const handleHistoryAction = useCallback((action: 'undo' | 'redo') => {
    console.log(`${action} called. Current index:`, currentHistoryIndex);
    console.log('History length:', history.length);

    if (action === 'undo' && currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      const previousState = history[newIndex];
      setCurrentHistoryIndex(newIndex);
      setImageRemovedRegions(previousState.imageRemovedRegions);
      setGridOutlinedRegions(previousState.gridOutlinedRegions);
      setTintedRegions(previousState.tintedRegions);
    } else if (action === 'redo' && currentHistoryIndex < history.length - 1) {
      const newIndex = currentHistoryIndex + 1;
      const nextState = history[newIndex];
      setCurrentHistoryIndex(newIndex);
      setImageRemovedRegions(nextState.imageRemovedRegions);
      setGridOutlinedRegions(nextState.gridOutlinedRegions);
      setTintedRegions(nextState.tintedRegions);
    }
  }, [currentHistoryIndex, history]);

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
                  settings={{
                    varianceThreshold,
                    maxLevel,
                    outlineColor,
                    outlineWidth
                  }}
                  brushRadius={brushRadius}
                  revealMode={revealMode}
                  imageRemovedRegions={imageRemovedRegions}
                  gridOutlinedRegions={gridOutlinedRegions}
                  tintedRegions={tintedRegions}
                  fillColor={fillColor}
                  blendMode={blendMode}
                  tintOpacity={tintOpacity}
                  onImageRemovedRegionsChange={handleImageRegionsChange}
                  onGridOutlinedRegionsChange={handleGridRegionsChange}
                  onTintedRegionsChange={handleTintedRegionsChange}
                  onBatchOperationStart={() => setIsInBatchOperation(true)}
                  onBatchOperationEnd={handleBatchOperationEnd}
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
                  fillColor={fillColor}
                  onFillColorChange={setFillColor}
                  blendMode={blendMode}
                  onBlendModeChange={setBlendMode}
                  tintOpacity={tintOpacity}
                  onTintOpacityChange={setTintOpacity}
                  onReset={() => {
                    setImageRemovedRegions([]);
                    setGridOutlinedRegions([]);
                    setTintedRegions([]);
                    setHistory([{ 
                      imageRemovedRegions: [], 
                      gridOutlinedRegions: [],
                      tintedRegions: []
                    }]);
                    setCurrentHistoryIndex(0);
                  }}
                  onUploadNewImage={() => setImageUrl(null)}
                  onDownloadImage={handleDownload}
                  onUndo={() => handleHistoryAction('undo')}
                  onRedo={() => handleHistoryAction('redo')}
                  canUndo={currentHistoryIndex > 0}
                  canRedo={currentHistoryIndex < history.length - 1}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default App

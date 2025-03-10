import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './ImagePreview.module.css';
import { createQuadTree, renderQuadTree, QuadTreeNode, findRegionsInBrush } from '../utils/quadtree';
import ImageUpload from './ImageUpload';

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

interface Point {
  x: number;
  y: number;
}

interface EffectSettings {
  varianceThreshold: number;
  maxLevel: number;
  outlineColor: string;
  outlineWidth: number;
}

interface ImagePreviewProps {
  imageUrl: string | null;
  settings: EffectSettings;
  brushRadius: number;
  revealMode: RevealMode;
  imageRemovedRegions: Region[];
  gridOutlinedRegions: Region[];
  tintedRegions: TintedRegion[];
  fillColor: string;
  blendMode: BlendMode;
  tintOpacity: number;
  onImageSelect: (file: File) => void;
  onImageRemovedRegionsChange: (regions: Region[]) => void;
  onGridOutlinedRegionsChange: (regions: Region[]) => void;
  onTintedRegionsChange: (regions: TintedRegion[]) => void;
  onBatchOperationStart: () => void;
  onBatchOperationEnd: (
    newImageRegions: Region[], 
    newGridRegions: Region[],
    newTintedRegions: TintedRegion[]
  ) => void;
}

export default function ImagePreview({
  imageUrl,
  settings,
  brushRadius,
  revealMode,
  imageRemovedRegions,
  gridOutlinedRegions,
  tintedRegions,
  fillColor,
  blendMode,
  tintOpacity,
  onImageSelect,
  onImageRemovedRegionsChange,
  onGridOutlinedRegionsChange,
  onTintedRegionsChange,
  onBatchOperationStart,
  onBatchOperationEnd,
}: ImagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dimensionsRef = useRef<{ width: number; height: number; displayWidth: number; displayHeight: number } | null>(null);
  const quadtreeRef = useRef<QuadTreeNode | null>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTimeoutRef = useRef<number | null>(null);
  const [hoveredRegions, setHoveredRegions] = useState<Region[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<Point | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Create temporary canvas once
  useEffect(() => {
    tempCanvasRef.current = document.createElement('canvas');
    return () => {
      tempCanvasRef.current = null;
    };
  }, []);

  // Load and setup image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.src = imageUrl || '';

    img.onload = () => {
      // Calculate dimensions to fill the viewport minus the control panel width and padding
      const containerWidth = window.innerWidth - 300 - 64; // Viewport width minus control panel and padding
      const containerHeight = window.innerHeight - 64; // Full viewport height minus padding
      
      // Calculate scaling factors to maintain aspect ratio
      const scaleX = containerWidth / img.width;
      const scaleY = containerHeight / img.height;
      const scale = Math.min(scaleX, scaleY);
      
      // Calculate display dimensions
      const displayWidth = img.width * scale;
      const displayHeight = img.height * scale;

      // Store both original and display dimensions
      dimensionsRef.current = { 
        width: img.width, 
        height: img.height,
        displayWidth,
        displayHeight
      };
      imageRef.current = img;

      // Set canvas to display dimensions
      canvas.width = displayWidth;
      canvas.height = displayHeight;

      // Create a temporary canvas at full resolution
      const fullResCanvas = document.createElement('canvas');
      fullResCanvas.width = img.width;
      fullResCanvas.height = img.height;
      const fullResCtx = fullResCanvas.getContext('2d', { willReadFrequently: true });
      if (!fullResCtx) return;

      // Draw original image at full resolution
      fullResCtx.drawImage(img, 0, 0);
      originalImageDataRef.current = fullResCtx.getImageData(0, 0, img.width, img.height);

      // Create quadtree at full resolution
      const quadtree = createQuadTree(
        fullResCtx,
        img.width,
        img.height,
        settings.maxLevel,
        settings.varianceThreshold
      );
      quadtreeRef.current = quadtree;

      renderImage();
    };

    return () => {
      imageRef.current = null;
      dimensionsRef.current = null;
      quadtreeRef.current = null;
      originalImageDataRef.current = null;
    };
  }, [imageUrl, settings.maxLevel, settings.varianceThreshold]);

  // Optimized render function
  const renderImage = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    const img = imageRef.current;
    const dimensions = dimensionsRef.current;
    const tempCanvas = tempCanvasRef.current;
    const quadtree = quadtreeRef.current;

    if (!canvas || !ctx || !img || !dimensions || !tempCanvas || !quadtree) return;

    // Create a temporary canvas at full resolution
    tempCanvas.width = dimensions.width;
    tempCanvas.height = dimensions.height;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) return;

    // Draw the original image at full resolution
    tempCtx.drawImage(img, 0, 0);

    // Draw the quadtree effect
    renderQuadTree(
      tempCtx, 
      quadtree, 
      settings.outlineColor, 
      settings.outlineWidth, 
      [], // No outlines in base render
      false // No outlines for now
    );

    // Restore original pixels for image-removed regions (always)
    if (imageRemovedRegions.length > 0) {
      // Create a temporary canvas for the original image
      const originalCanvas = document.createElement('canvas');
      originalCanvas.width = dimensions.width;
      originalCanvas.height = dimensions.height;
      const originalCtx = originalCanvas.getContext('2d', { willReadFrequently: true });
      if (!originalCtx) return;

      // Draw original image
      originalCtx.drawImage(img, 0, 0);

      // Restore pixels from original image at exact boundaries
      imageRemovedRegions.forEach(region => {
        const regionImageData = originalCtx.getImageData(
          region.x,
          region.y,
          region.width,
          region.height
        );
        tempCtx.putImageData(regionImageData, region.x, region.y);
      });
    }

    // Clear the display canvas
    ctx.clearRect(0, 0, dimensions.displayWidth, dimensions.displayHeight);

    // Scale down to display size
    ctx.drawImage(tempCanvas, 0, 0, dimensions.width, dimensions.height, 0, 0, dimensions.displayWidth, dimensions.displayHeight);

    // Draw tinted regions
    if (tintedRegions.length > 0) {
      const scaleX = dimensions.displayWidth / dimensions.width;
      const scaleY = dimensions.displayHeight / dimensions.height;
      
      tintedRegions.forEach(region => {
        const displayRegion = {
          x: region.x * scaleX,
          y: region.y * scaleY,
          width: region.width * scaleX,
          height: region.height * scaleY
        };

        ctx.save();
        ctx.globalCompositeOperation = region.blendMode;
        ctx.globalAlpha = region.opacity / 100;
        ctx.fillStyle = region.color;
        ctx.fillRect(
          displayRegion.x,
          displayRegion.y,
          displayRegion.width,
          displayRegion.height
        );
        ctx.restore();
      });
    }

    // Draw outlines for grid mode regions (always)
    if (gridOutlinedRegions.length > 0 && settings.outlineWidth > 0) {
      const scaleX = dimensions.displayWidth / dimensions.width;
      const scaleY = dimensions.displayHeight / dimensions.height;
      gridOutlinedRegions.forEach(region => {
        const displayRegion = {
          x: region.x * scaleX,
          y: region.y * scaleY,
          width: region.width * scaleX,
          height: region.height * scaleY
        };
        ctx.strokeStyle = settings.outlineColor;
        // Scale the line width to match the download version
        ctx.lineWidth = settings.outlineWidth * scaleX;
        // Apply offset in original image space before scaling
        const offset = settings.outlineWidth;
        ctx.strokeRect(
          displayRegion.x + (offset * scaleX),
          displayRegion.y + (offset * scaleY),
          displayRegion.width - (offset * 2 * scaleX),
          displayRegion.height - (offset * 2 * scaleY)
        );
      });
    }

    // Draw hover effect if there's a hovered region
    if (hoveredRegions.length > 0) {
      const scaleX = dimensions.displayWidth / dimensions.width;
      const scaleY = dimensions.displayHeight / dimensions.height;
      
      hoveredRegions.forEach(region => {
        const displayRegion = {
          x: region.x * scaleX,
          y: region.y * scaleY,
          width: region.width * scaleX,
          height: region.height * scaleY
        };

        ctx.save();
        if (revealMode === 'add-color') {
          ctx.globalCompositeOperation = blendMode;
          ctx.globalAlpha = tintOpacity / 100; // Use actual opacity
          ctx.fillStyle = fillColor;
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        }
        ctx.fillRect(
          displayRegion.x,
          displayRegion.y,
          displayRegion.width,
          displayRegion.height
        );
        ctx.restore();
      });
    }
  }, [
    settings.outlineColor,
    settings.outlineWidth,
    hoveredRegions,
    imageRemovedRegions,
    gridOutlinedRegions,
    tintedRegions,
    revealMode,
    fillColor,
    blendMode,
    tintOpacity
  ]);

  // Debounced mouse move handler
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !imageRef.current || !quadtreeRef.current || !dimensionsRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const dimensions = dimensionsRef.current;
    
    // Calculate the actual CSS scale factor
    const cssScaleX = rect.width / canvas.width;
    const cssScaleY = rect.height / canvas.height;
    
    // Adjust the mouse coordinates for both CSS scaling and image scaling
    const x = ((e.clientX - rect.left) / cssScaleX) * (dimensions.width / dimensions.displayWidth);
    const y = ((e.clientY - rect.top) / cssScaleY) * (dimensions.height / dimensions.displayHeight);

    setCursorPosition({ 
      x: e.clientX, 
      y: e.clientY 
    });

    if (isDragging) {
      const regions = findRegionsInBrush(quadtreeRef.current, { x, y }, brushRadius * (dimensions.width / dimensions.displayWidth));
      if (regions.length > 0) {
        const newRegions = regions.map(node => ({
          x: node.region.x,
          y: node.region.y,
          width: node.region.width,
          height: node.region.height
        }));

        if (revealMode === 'image') {
          onImageRemovedRegionsChange([...imageRemovedRegions, ...newRegions]);
        } else if (revealMode === 'grid') {
          // In grid mode, add outlines for regions that don't already have them
          const existingRegions = new Set(gridOutlinedRegions.map(r => 
            `${r.x},${r.y},${r.width},${r.height}`
          ));
          const uniqueNewRegions = newRegions.filter(region => 
            !existingRegions.has(`${region.x},${region.y},${region.width},${region.height}`)
          );
          onGridOutlinedRegionsChange([...gridOutlinedRegions, ...uniqueNewRegions]);
        } else if (revealMode === 'conceal') {
          // In conceal mode, remove regions that are currently revealed
          const existingRegions = new Set(imageRemovedRegions.map(r => 
            `${r.x},${r.y},${r.width},${r.height}`
          ));
          const regionsToKeep = imageRemovedRegions.filter(region => {
            const key = `${region.x},${region.y},${region.width},${region.height}`;
            const isInBrush = newRegions.some(newRegion => 
              `${newRegion.x},${newRegion.y},${newRegion.width},${newRegion.height}` === key
            );
            return !isInBrush;
          });
          onImageRemovedRegionsChange(regionsToKeep);
        } else if (revealMode === 'remove-outlines') {
          // In remove-outlines mode, remove regions that are currently outlined
          const regionsToKeep = gridOutlinedRegions.filter(region => {
            const key = `${region.x},${region.y},${region.width},${region.height}`;
            const isInBrush = newRegions.some(newRegion => 
              `${newRegion.x},${newRegion.y},${newRegion.width},${newRegion.height}` === key
            );
            return !isInBrush;
          });
          onGridOutlinedRegionsChange(regionsToKeep);
        } else if (revealMode === 'add-color') {
          // Add color to regions, including those that already have color
          const newRegions = regions.map(node => ({
            x: node.region.x,
            y: node.region.y,
            width: node.region.width,
            height: node.region.height,
            color: fillColor,
            blendMode: blendMode,
            opacity: tintOpacity
          }));

          // Create a map of region keys to their latest color settings
          const regionMap = new Map();
          [...tintedRegions, ...newRegions].forEach(region => {
            const key = `${region.x},${region.y},${region.width},${region.height}`;
            regionMap.set(key, region);
          });

          // Convert map back to array, keeping only the latest color for each region
          onTintedRegionsChange(Array.from(regionMap.values()));
        } else if (revealMode === 'remove-color') {
          // Remove color from regions that have it
          const regionsToKeep = tintedRegions.filter(region => {
            const key = `${region.x},${region.y},${region.width},${region.height}`;
            const isInBrush = newRegions.some(newRegion => 
              `${newRegion.x},${newRegion.y},${newRegion.width},${newRegion.height}` === key
            );
            return !isInBrush;
          });
          onTintedRegionsChange(regionsToKeep);
        }
      }
    }

    // Update hovered regions
    const regions = findRegionsInBrush(quadtreeRef.current, { x, y }, brushRadius * (dimensions.width / dimensions.displayWidth));
    if (regions.length > 0) {
      const newRegions = regions.map(node => ({
        x: node.region.x,
        y: node.region.y,
        width: node.region.width,
        height: node.region.height
      }));

      // Only show hover effect for:
      // - Unrevealed regions in 'image' mode
      // - Unoutlined regions in 'grid' mode
      // - Revealed regions in 'conceal' mode
      // - Outlined regions in 'remove-outlines' mode
      // - Untinted regions in 'add-color' mode
      // - Tinted regions in 'remove-color' mode
      const existingImageRegions = new Set(imageRemovedRegions.map(r => 
        `${r.x},${r.y},${r.width},${r.height}`
      ));
      const existingGridRegions = new Set(gridOutlinedRegions.map(r => 
        `${r.x},${r.y},${r.width},${r.height}`
      ));
      const existingTintRegions = new Set(tintedRegions.map(r => 
        `${r.x},${r.y},${r.width},${r.height}`
      ));

      const hoveredRegions = newRegions.filter(region => {
        const key = `${region.x},${region.y},${region.width},${region.height}`;
        if (revealMode === 'image') {
          return !existingImageRegions.has(key);
        } else if (revealMode === 'grid') {
          return !existingGridRegions.has(key);
        } else if (revealMode === 'conceal') {
          return existingImageRegions.has(key);
        } else if (revealMode === 'remove-outlines') {
          return existingGridRegions.has(key);
        } else if (revealMode === 'add-color') {
          return true; // Allow hovering over all regions, including those already colored
        } else { // remove-color mode
          return existingTintRegions.has(key);
        }
      });

      setHoveredRegions(hoveredRegions);
    } else {
      setHoveredRegions([]);
    }
  }, [
    isDragging,
    brushRadius,
    imageRemovedRegions,
    gridOutlinedRegions,
    tintedRegions,
    revealMode,
    onImageRemovedRegionsChange,
    onGridOutlinedRegionsChange,
    onTintedRegionsChange,
    fillColor,
    blendMode,
    tintOpacity
  ]);

  const isPointInCircle = (point: Point, center: Point, radius: number): boolean => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return dx * dx + dy * dy <= radius * radius;
  };

  const doesRegionOverlapCircle = (region: { x: number; y: number; width: number; height: number }, center: Point, radius: number): boolean => {
    // Check if any corner of the region is inside the circle
    const corners = [
      { x: region.x, y: region.y },
      { x: region.x + region.width, y: region.y },
      { x: region.x, y: region.y + region.height },
      { x: region.x + region.width, y: region.y + region.height }
    ];

    // Check if any corner is inside the circle
    if (corners.some(corner => isPointInCircle(corner, center, radius))) {
      return true;
    }

    // Check if circle center is inside the region
    if (center.x >= region.x && center.x <= region.x + region.width &&
        center.y >= region.y && center.y <= region.y + region.height) {
      return true;
    }

    // Check if circle intersects with region edges
    const closestX = Math.max(region.x, Math.min(center.x, region.x + region.width));
    const closestY = Math.max(region.y, Math.min(center.y, region.y + region.height));
    const distanceX = center.x - closestX;
    const distanceY = center.y - closestY;
    return (distanceX * distanceX + distanceY * distanceY) <= (radius * radius);
  };

  const findRegionsInBrush = (node: QuadTreeNode, center: Point, radius: number): QuadTreeNode[] => {
    const regions: QuadTreeNode[] = [];

    if (node.children) {
      node.children.forEach(child => {
        regions.push(...findRegionsInBrush(child, center, radius));
      });
    } else if (doesRegionOverlapCircle(node.region, center, radius)) {
      regions.push(node);
    }

    return regions;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setHoveredRegions([]); // Clear hover effect on click
    handleMouseMove(e); // Remove region on initial click
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredRegions([]);
    setIsHovering(false);
    setCursorPosition(null);
  };

  const handleReset = () => {
    onImageRemovedRegionsChange([]);
    onGridOutlinedRegionsChange([]);
    onTintedRegionsChange([]);
    setHoveredRegions([]);
    setIsDragging(false);
    setCursorPosition(null);
    setIsHovering(false);
  };

  const handleRegionClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !imageRef.current || !quadtreeRef.current || !dimensionsRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const dimensions = dimensionsRef.current;
    
    // Calculate the actual CSS scale factor
    const cssScaleX = rect.width / canvas.width;
    const cssScaleY = rect.height / canvas.height;
    
    // Adjust the mouse coordinates for both CSS scaling and image scaling
    const x = ((e.clientX - rect.left) / cssScaleX) * (dimensions.width / dimensions.displayWidth);
    const y = ((e.clientY - rect.top) / cssScaleY) * (dimensions.height / dimensions.displayHeight);

    const regions = findRegionsInBrush(quadtreeRef.current, { x, y }, brushRadius * (dimensions.width / dimensions.displayWidth));
    if (regions.length > 0) {
      const newRegions = regions.map(node => ({
        x: node.region.x,
        y: node.region.y,
        width: node.region.width,
        height: node.region.height
      }));

      if (revealMode === 'image') {
        onImageRemovedRegionsChange([...imageRemovedRegions, ...newRegions]);
      } else {
        // In grid mode, add outlines for regions that don't already have them
        const existingRegions = new Set(gridOutlinedRegions.map(r => 
          `${r.x},${r.y},${r.width},${r.height}`
        ));
        const uniqueNewRegions = newRegions.filter(region => 
          !existingRegions.has(`${region.x},${region.y},${region.width},${region.height}`)
        );
        onGridOutlinedRegionsChange([...gridOutlinedRegions, ...uniqueNewRegions]);
      }
    }
  };

  // Update effect to use optimized render
  useEffect(() => {
    renderImage();
  }, [renderImage]);

  return (
    <div className={styles.previewContainer}>
      {imageUrl ? (
        <>
          <canvas
            ref={canvasRef}
            className={styles.previewCanvas}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            style={{
              cursor: 'none'
            }}
          />
          {cursorPosition && isHovering && (
            <div
              className={styles.brushCursor}
              style={{
                left: cursorPosition.x,
                top: cursorPosition.y,
                width: brushRadius * 2,
                height: brushRadius * 2,
                border: '1.5px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '50%',
                position: 'fixed',
                pointerEvents: 'none',
                zIndex: 1000,
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'transparent',
                background: 'transparent',
                boxShadow: 'none'
              }}
            />
          )}
        </>
      ) : (
        <ImageUpload onImageSelect={onImageSelect} />
      )}
    </div>
  );
} 
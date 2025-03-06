import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './ImagePreview.module.css';
import { createQuadTree, renderQuadTree, QuadTreeNode } from '../utils/quadtree';

interface EffectSettings {
  varianceThreshold: number;
  maxLevel: number;
  outlineColor: string;
  outlineWidth: number;
}

interface ImagePreviewProps {
  imageUrl: string;
  effect: string;
  settings: EffectSettings;
  brushRadius: number;
  revealMode: 'image' | 'grid';
  imageRemovedRegions: RemovedRegion[];
  gridOutlinedRegions: RemovedRegion[];
  onImageRemovedRegionsChange: (regions: RemovedRegion[]) => void;
  onGridOutlinedRegionsChange: (regions: RemovedRegion[]) => void;
}

interface RemovedRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

export default function ImagePreview({
  imageUrl,
  effect,
  settings,
  brushRadius,
  revealMode,
  imageRemovedRegions,
  gridOutlinedRegions,
  onImageRemovedRegionsChange,
  onGridOutlinedRegionsChange,
}: ImagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dimensionsRef = useRef<{ width: number; height: number; displayWidth: number; displayHeight: number } | null>(null);
  const quadtreeRef = useRef<QuadTreeNode | null>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTimeoutRef = useRef<number | null>(null);
  const [hoveredRegions, setHoveredRegions] = useState<RemovedRegion[]>([]);
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
    img.src = imageUrl;

    img.onload = () => {
      // Calculate dimensions to fill the left side of the viewport with 10% padding
      const containerWidth = window.innerWidth * 0.5; // 50% of viewport width
      const containerHeight = window.innerHeight; // Full viewport height
      
      // Calculate available space with 10% padding
      const availableWidth = containerWidth * 0.9;
      const availableHeight = containerHeight * 0.9;
      
      // Calculate scaling factors to maintain aspect ratio
      const scaleX = availableWidth / img.width;
      const scaleY = availableHeight / img.height;
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
      hoveredRegions.forEach(region => {
        // Scale hover region to display size
        const scaleX = dimensions.displayWidth / dimensions.width;
        const scaleY = dimensions.displayHeight / dimensions.height;
        const displayRegion = {
          x: region.x * scaleX,
          y: region.y * scaleY,
          width: region.width * scaleX,
          height: region.height * scaleY
        };

        // Show white overlay for both modes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(
          displayRegion.x,
          displayRegion.y,
          displayRegion.width,
          displayRegion.height
        );
      });
    }
  }, [settings.outlineColor, settings.outlineWidth, hoveredRegions, imageRemovedRegions, gridOutlinedRegions, revealMode]);

  // Debounced mouse move handler
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !imageRef.current || !quadtreeRef.current || !dimensionsRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const dimensions = dimensionsRef.current;
    
    // Scale mouse coordinates to match full resolution
    const scaleX = dimensions.width / dimensions.displayWidth;
    const scaleY = dimensions.height / dimensions.displayHeight;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setCursorPosition({ x: e.clientX, y: e.clientY });

    if (isDragging) {
      const regions = findRegionsInBrush(quadtreeRef.current, { x, y }, brushRadius * scaleX);
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
    } else {
      // Update hovered regions
      const regions = findRegionsInBrush(quadtreeRef.current, { x, y }, brushRadius * scaleX);
      if (regions.length > 0) {
        setHoveredRegions(regions.map(node => ({
          x: node.region.x,
          y: node.region.y,
          width: node.region.width,
          height: node.region.height
        })));
      } else {
        setHoveredRegions([]);
      }
    }
  }, [isDragging, brushRadius, imageRemovedRegions, gridOutlinedRegions, revealMode, onImageRemovedRegionsChange, onGridOutlinedRegionsChange]);

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
    
    // Scale mouse coordinates to match full resolution
    const scaleX = dimensions.width / dimensions.displayWidth;
    const scaleY = dimensions.height / dimensions.displayHeight;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const regions = findRegionsInBrush(quadtreeRef.current, { x, y }, brushRadius * scaleX);
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
    </div>
  );
} 
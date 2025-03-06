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
  gridRemovedRegions: RemovedRegion[];
  onImageRemovedRegionsChange: (regions: RemovedRegion[]) => void;
  onGridRemovedRegionsChange: (regions: RemovedRegion[]) => void;
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
  gridRemovedRegions,
  onImageRemovedRegionsChange,
  onGridRemovedRegionsChange,
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

    const ctx = canvas.getContext('2d');
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
      const fullResCtx = fullResCanvas.getContext('2d');
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
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    const dimensions = dimensionsRef.current;
    const tempCanvas = tempCanvasRef.current;
    const quadtree = quadtreeRef.current;

    if (!canvas || !ctx || !img || !dimensions || !tempCanvas || !quadtree) return;

    // Clear any pending render
    if (renderTimeoutRef.current) {
      window.clearTimeout(renderTimeoutRef.current);
    }

    // Schedule render for next frame
    renderTimeoutRef.current = window.setTimeout(() => {
      // Create a temporary canvas at full resolution
      tempCanvas.width = dimensions.width;
      tempCanvas.height = dimensions.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Draw the original image at full resolution
      tempCtx.drawImage(img, 0, 0);

      // Apply current mode's effect at full resolution
      if (revealMode === 'image') {
        // In image mode, render the quadtree with outlines for non-removed regions
        renderQuadTree(tempCtx, quadtree, settings.outlineColor, settings.outlineWidth, gridRemovedRegions);
        
        // Restore original pixels for image-removed regions
        if (originalImageDataRef.current) {
          imageRemovedRegions.forEach(region => {
            // Skip invalid regions
            if (region.width <= 0 || region.height <= 0) return;
            
            // Ensure region is within image bounds
            const maxX = Math.min(region.x + region.width, originalImageDataRef.current!.width);
            const maxY = Math.min(region.y + region.height, originalImageDataRef.current!.height);
            const validWidth = maxX - region.x;
            const validHeight = maxY - region.y;
            
            if (validWidth <= 0 || validHeight <= 0) return;
            
            // Create region data array with correct size
            const regionData = new Uint8ClampedArray(validWidth * validHeight * 4);
            const originalData = originalImageDataRef.current!.data;
            const originalWidth = originalImageDataRef.current!.width;
            
            for (let y = 0; y < validHeight; y++) {
              for (let x = 0; x < validWidth; x++) {
                const originalIndex = ((region.y + y) * originalWidth + (region.x + x)) * 4;
                const regionIndex = (y * validWidth + x) * 4;
                
                if (originalIndex + 3 < originalData.length) {
                  regionData[regionIndex] = originalData[originalIndex];
                  regionData[regionIndex + 1] = originalData[originalIndex + 1];
                  regionData[regionIndex + 2] = originalData[originalIndex + 2];
                  regionData[regionIndex + 3] = originalData[originalIndex + 3];
                }
              }
            }
            
            const regionImageData = new ImageData(regionData, validWidth, validHeight);
            tempCtx.putImageData(regionImageData, region.x, region.y);
          });
        }
      } else {
        // In grid mode, render the quadtree with outlines only for non-removed regions
        renderQuadTree(tempCtx, quadtree, settings.outlineColor, settings.outlineWidth, gridRemovedRegions);
      }

      // Scale down to display size
      ctx.drawImage(tempCanvas, 0, 0, dimensions.width, dimensions.height, 0, 0, dimensions.displayWidth, dimensions.displayHeight);

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

          if (revealMode === 'image') {
            // In image mode, show only the white overlay
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(
              displayRegion.x,
              displayRegion.y,
              displayRegion.width,
              displayRegion.height
            );
          } else {
            // In grid mode, show only the neon green outline
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = settings.outlineWidth * scaleX;
            ctx.strokeRect(
              displayRegion.x,
              displayRegion.y,
              displayRegion.width,
              displayRegion.height
            );
          }
        });
      }
    }, 0);
  }, [settings.outlineColor, settings.outlineWidth, hoveredRegions, imageRemovedRegions, gridRemovedRegions, revealMode]);

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
          onGridRemovedRegionsChange([...gridRemovedRegions, ...newRegions]);
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
  }, [isDragging, brushRadius, imageRemovedRegions, gridRemovedRegions, revealMode, onImageRemovedRegionsChange, onGridRemovedRegionsChange]);

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
    onGridRemovedRegionsChange([]);
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
        onGridRemovedRegionsChange([...gridRemovedRegions, ...newRegions]);
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
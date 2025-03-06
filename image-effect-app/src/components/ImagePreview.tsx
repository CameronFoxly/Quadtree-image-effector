import { useEffect, useRef, useState } from 'react';
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
}: ImagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dimensionsRef = useRef<{ width: number; height: number } | null>(null);
  const quadtreeRef = useRef<QuadTreeNode | null>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);
  const [hoveredRegions, setHoveredRegions] = useState<QuadTreeNode[]>([]);
  const [removedRegions, setRemovedRegions] = useState<RemovedRegion[]>([]);
  const [outlineRemovedRegions, setOutlineRemovedRegions] = useState<RemovedRegion[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<Point | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Load and setup image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      // Calculate dimensions to maintain aspect ratio
      const maxWidth = canvas.parentElement?.clientWidth || 800;
      const maxHeight = window.innerHeight * 0.6; // 60vh
      
      let width = img.width;
      let height = img.height;

      // Scale down if image is too large
      if (width > maxWidth) {
        height = (maxWidth * height) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (maxHeight * width) / height;
        height = maxHeight;
      }

      // Store dimensions and image for later use
      dimensionsRef.current = { width, height };
      imageRef.current = img;

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw the original image first and store its data
      ctx.drawImage(img, 0, 0, width, height);
      originalImageDataRef.current = ctx.getImageData(0, 0, width, height);

      // Create and render quadtree immediately
      const quadtree = createQuadTree(
        ctx,
        width,
        height,
        settings.maxLevel,
        settings.varianceThreshold
      );
      quadtreeRef.current = quadtree;

      renderQuadTree(ctx, quadtree, settings.outlineColor, settings.outlineWidth, removedRegions);
    };

    return () => {
      imageRef.current = null;
      dimensionsRef.current = null;
      quadtreeRef.current = null;
      originalImageDataRef.current = null;
    };
  }, [imageUrl, settings.maxLevel, settings.varianceThreshold, settings.outlineColor, settings.outlineWidth]);

  // Apply quadtree effect when settings change
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    const dimensions = dimensionsRef.current;

    if (!canvas || !ctx || !img || !dimensions) return;

    // Draw the original image first
    ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

    // Create and render quadtree
    const quadtree = createQuadTree(
      ctx,
      dimensions.width,
      dimensions.height,
      settings.maxLevel,
      settings.varianceThreshold
    );
    quadtreeRef.current = quadtree;

    // Draw the quadtree effect
    renderQuadTree(ctx, quadtree, settings.outlineColor, settings.outlineWidth, outlineRemovedRegions);

    // Draw hover effect if there's a hovered region
    if (hoveredRegions.length > 0) {
      hoveredRegions.forEach(region => {
        // Draw white overlay with 30% opacity
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(
          region.region.x,
          region.region.y,
          region.region.width,
          region.region.height
        );

        // Draw neon green outline for hovered region
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = settings.outlineWidth;
        ctx.strokeRect(
          region.region.x,
          region.region.y,
          region.region.width,
          region.region.height
        );
      });
    }

    // Restore original pixels for removed regions in image mode
    if (revealMode === 'image' && originalImageDataRef.current) {
      removedRegions.forEach(region => {
        // Create a temporary canvas for the region
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = dimensions.width;
        tempCanvas.height = dimensions.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        // Draw the original image on the temporary canvas
        tempCtx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
        
        // Get the region's image data from the temporary canvas
        const regionImageData = tempCtx.getImageData(
          region.x,
          region.y,
          region.width,
          region.height
        );

        // Put the region's image data back on the main canvas
        ctx.putImageData(regionImageData, region.x, region.y);
      });
    }
  }, [settings.varianceThreshold, settings.maxLevel, settings.outlineColor, settings.outlineWidth, hoveredRegions, removedRegions, outlineRemovedRegions, revealMode]);

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

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !quadtreeRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const windowX = e.clientX;
    const windowY = e.clientY;
    
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    setCursorPosition({ x: windowX, y: windowY });

    const regions = findRegionsInBrush(quadtreeRef.current, { x: canvasX, y: canvasY }, brushRadius);
    setHoveredRegions(regions);

    if (isDragging) {
      if (revealMode === 'image') {
        setRemovedRegions(prev => {
          const newRegions = regions.filter(region => {
            return !prev.some(
              removed =>
                removed.x === region.region.x &&
                removed.y === region.region.y &&
                removed.width === region.region.width &&
                removed.height === region.region.height
            );
          });

          if (newRegions.length === 0) return prev;

          return [
            ...newRegions.map(region => ({
              x: region.region.x,
              y: region.region.y,
              width: region.region.width,
              height: region.region.height
            })),
            ...prev
          ];
        });
      } else {
        setOutlineRemovedRegions(prev => {
          const newRegions = regions.filter(region => {
            return !prev.some(
              removed =>
                removed.x === region.region.x &&
                removed.y === region.region.y &&
                removed.width === region.region.width &&
                removed.height === region.region.height
            );
          });

          if (newRegions.length === 0) return prev;

          return [
            ...newRegions.map(region => ({
              x: region.region.x,
              y: region.region.y,
              width: region.region.width,
              height: region.region.height
            })),
            ...prev
          ];
        });
      }
    }
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
    setRemovedRegions([]);
    setOutlineRemovedRegions([]);
    setHoveredRegions([]);
    setIsDragging(false);
    setCursorPosition(null);
    setIsHovering(false);
  };

  const handleRegionClick = (region: RemovedRegion) => {
    if (revealMode === 'image') {
      // In image mode, reveal original pixels but keep outlines
      setRemovedRegions(prev => [...prev, region]);
    } else {
      // In grid mode, remove outlines but keep averaged pixels
      setOutlineRemovedRegions(prev => [...prev, region]);
    }
  };

  return (
    <div className={styles.previewContainer}>
      <div className={styles.controls}>
        <button 
          className={styles.resetButton}
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
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
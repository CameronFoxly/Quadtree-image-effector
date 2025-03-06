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
  settings: EffectSettings;
  brushRadius: number;
  revealMode: 'image' | 'grid';
  imageRemovedRegions: RemovedRegion[];
  gridOutlinedRegions: RemovedRegion[];
  onImageRemovedRegionsChange: (regions: RemovedRegion[], strokeRegions: RemovedRegion[]) => void;
  onGridOutlinedRegionsChange: (regions: RemovedRegion[], strokeRegions: RemovedRegion[]) => void;
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
  const currentDragRegions = useRef<RemovedRegion[]>([]);

  // ... keep existing useEffect and other functions ...

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
      // Clear hover regions during dragging
      setHoveredRegions([]);
      
      const regions = findRegionsInBrush(quadtreeRef.current, { x, y }, brushRadius * Math.min(scaleX, scaleY));
      if (regions.length > 0) {
        const newRegions = regions.map(node => ({
          x: node.region.x,
          y: node.region.y,
          width: node.region.width,
          height: node.region.height
        }));

        // Add new regions to both current drag and active regions
        const existingRegions = revealMode === 'image' ? imageRemovedRegions : gridOutlinedRegions;
        const uniqueNewRegions = newRegions.filter(region => 
          !existingRegions.some(r => 
            r.x === region.x && 
            r.y === region.y && 
            r.width === region.width && 
            r.height === region.height
          ) &&
          !currentDragRegions.current.some(r =>
            r.x === region.x &&
            r.y === region.y &&
            r.width === region.width &&
            r.height === region.height
          )
        );

        if (uniqueNewRegions.length > 0) {
          currentDragRegions.current = [...currentDragRegions.current, ...uniqueNewRegions];
          if (revealMode === 'image') {
            onImageRemovedRegionsChange([...imageRemovedRegions, ...uniqueNewRegions], []);
          } else {
            onGridOutlinedRegionsChange([...gridOutlinedRegions, ...uniqueNewRegions], []);
          }
        }
      }
    } else {
      // Only show hover regions when not dragging
      const regions = findRegionsInBrush(quadtreeRef.current, { x, y }, brushRadius * Math.min(scaleX, scaleY));
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

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setHoveredRegions([]); // Clear hover effect on click
    currentDragRegions.current = []; // Reset drag regions
    handleMouseMove(e); // Handle initial click
  };

  const handleMouseUp = () => {
    if (currentDragRegions.current.length > 0) {
      // Send the complete stroke regions to the parent
      if (revealMode === 'image') {
        onImageRemovedRegionsChange([...imageRemovedRegions], currentDragRegions.current);
      } else {
        onGridOutlinedRegionsChange([...gridOutlinedRegions], currentDragRegions.current);
      }
    }
    setIsDragging(false);
    currentDragRegions.current = [];
    setHoveredRegions([]); // Clear hover regions when releasing mouse
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    currentDragRegions.current = [];
    setHoveredRegions([]);
    setCursorPosition(null);
    setIsHovering(false);
  };

  // ... keep rest of the component the same ...
} 
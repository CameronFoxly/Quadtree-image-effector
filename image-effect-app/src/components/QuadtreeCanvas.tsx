import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './QuadtreeCanvas.module.css';

interface Cell {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface QuadtreeCanvasProps {
  cells: Cell[];
  width: number;
  height: number;
}

export default function QuadtreeCanvas({ cells, width, height }: QuadtreeCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<Cell | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (frameRef.current) return; // Skip if frame is pending

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Skip if mouse hasn't moved much (optional optimization)
    const dx = x - lastMousePos.current.x;
    const dy = y - lastMousePos.current.y;
    if (Math.sqrt(dx * dx + dy * dy) < 2) return;

    lastMousePos.current = { x, y };

    frameRef.current = requestAnimationFrame(() => {
      const hoveredCell = cells.find(cell => {
        return x >= cell.x && x < cell.x + cell.width &&
               y >= cell.y && y < cell.y + cell.height;
      });

      setHoveredCell(hoveredCell || null);
      frameRef.current = null;
    });
  }, [cells]);

  const handleMouseLeave = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    setHoveredCell(null);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [handleMouseMove, handleMouseLeave]);

  return (
    <div 
      ref={canvasRef}
      className={styles.canvas}
      style={{ width, height }}
    >
      {cells.map((cell, index) => (
        <div
          key={`${cell.x}-${cell.y}-${cell.width}-${cell.height}`}
          className={styles.cell}
          style={{
            left: cell.x,
            top: cell.y,
            width: cell.width,
            height: cell.height,
            opacity: hoveredCell === cell ? 0.5 : 0,
            transition: 'opacity 0.15s ease-out',
          }}
        />
      ))}
    </div>
  );
} 
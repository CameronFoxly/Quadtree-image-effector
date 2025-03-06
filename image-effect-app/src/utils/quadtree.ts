interface Point {
  x: number;
  y: number;
}

interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface QuadTreeNode {
  region: Region;
  color: { r: number; g: number; b: number };
  children: QuadTreeNode[] | null;
  level: number;
  maxLevel: number;
}

// Calculate average RGB color of a region
function getAverageColor(
  ctx: CanvasRenderingContext2D,
  region: Region
): { r: number; g: number; b: number } {
  const imageData = ctx.getImageData(region.x, region.y, region.width, region.height);
  const data = imageData.data;
  
  let r = 0, g = 0, b = 0;
  const pixelCount = region.width * region.height;
  
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  
  return {
    r: Math.round(r / pixelCount),
    g: Math.round(g / pixelCount),
    b: Math.round(b / pixelCount)
  };
}

// Calculate RGB variance in a region
function getRGBVariance(
  ctx: CanvasRenderingContext2D,
  region: Region
): number {
  const imageData = ctx.getImageData(region.x, region.y, region.width, region.height);
  const data = imageData.data;
  
  let rSum = 0, gSum = 0, bSum = 0;
  let rSumSquared = 0, gSumSquared = 0, bSumSquared = 0;
  const pixelCount = region.width * region.height;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    rSum += r;
    gSum += g;
    bSum += b;
    
    rSumSquared += r * r;
    gSumSquared += g * g;
    bSumSquared += b * b;
  }
  
  // Calculate mean and variance for each channel
  const rMean = rSum / pixelCount;
  const gMean = gSum / pixelCount;
  const bMean = bSum / pixelCount;
  
  const rVariance = (rSumSquared / pixelCount) - (rMean * rMean);
  const gVariance = (gSumSquared / pixelCount) - (gMean * gMean);
  const bVariance = (bSumSquared / pixelCount) - (bMean * bMean);
  
  // Return the average of all three variances
  return (rVariance + gVariance + bVariance) / 3;
}

// Create a quadtree node
function createQuadTreeNode(
  ctx: CanvasRenderingContext2D,
  region: Region,
  level: number,
  maxLevel: number,
  varianceThreshold: number
): QuadTreeNode {
  const variance = getRGBVariance(ctx, region);
  const shouldSubdivide = variance > varianceThreshold && level < maxLevel;
  
  if (!shouldSubdivide) {
    return {
      region,
      color: getAverageColor(ctx, region),
      children: null,
      level,
      maxLevel
    };
  }
  
  // Subdivide the region
  const halfWidth = Math.floor(region.width / 2);
  const halfHeight = Math.floor(region.height / 2);
  
  const children = [
    createQuadTreeNode(ctx, { x: region.x, y: region.y, width: halfWidth + 1, height: halfHeight + 1 }, level + 1, maxLevel, varianceThreshold),
    createQuadTreeNode(ctx, { x: region.x + halfWidth - 1, y: region.y, width: region.width - halfWidth + 1, height: halfHeight + 1 }, level + 1, maxLevel, varianceThreshold),
    createQuadTreeNode(ctx, { x: region.x, y: region.y + halfHeight - 1, width: halfWidth + 1, height: region.height - halfHeight + 1 }, level + 1, maxLevel, varianceThreshold),
    createQuadTreeNode(ctx, { x: region.x + halfWidth - 1, y: region.y + halfHeight - 1, width: region.width - halfWidth + 1, height: region.height - halfHeight + 1 }, level + 1, maxLevel, varianceThreshold)
  ];
  
  return {
    region,
    color: { r: 0, g: 0, b: 0 }, // This will be calculated from children
    children,
    level,
    maxLevel
  };
}

// Draw the quadtree
function drawQuadTree(
  ctx: CanvasRenderingContext2D,
  node: QuadTreeNode,
  outlineColor: string,
  outlineWidth: number,
  removedRegions: { x: number; y: number; width: number; height: number }[] = []
) {
  if (node.children) {
    // Draw children
    node.children.forEach(child => drawQuadTree(ctx, child, outlineColor, outlineWidth, removedRegions));
  } else {
    // Check if this region has been removed
    const isRemoved = removedRegions.some(
      region =>
        region.x === node.region.x &&
        region.y === node.region.y &&
        region.width === node.region.width &&
        region.height === node.region.height
    );

    // Always draw the region color
    ctx.fillStyle = `rgb(${node.color.r}, ${node.color.g}, ${node.color.b})`;
    ctx.fillRect(node.region.x, node.region.y, node.region.width, node.region.height);
    
    // Only draw outline if region is not removed and outlineWidth is greater than 0
    if (!isRemoved && outlineWidth > 0) {
      // Inset the outline by half the outline width to prevent overlap
      const inset = outlineWidth / 2;
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = outlineWidth;
      ctx.strokeRect(
        node.region.x + inset,
        node.region.y + inset,
        node.region.width - outlineWidth,
        node.region.height - outlineWidth
      );
    }
  }
}

export const createQuadTree = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  maxLevel: number,
  varianceThreshold: number
): QuadTreeNode => {
  const createNode = (x: number, y: number, width: number, height: number, level: number): QuadTreeNode => {
    const imageData = ctx.getImageData(x, y, width, height);
    const color = getAverageColor(ctx, { x, y, width, height });
    const variance = getRGBVariance(ctx, { x, y, width, height });

    if (level >= maxLevel || variance <= varianceThreshold) {
      return createLeafNode({ x, y, width, height }, color, level, maxLevel);
    }

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    const children = [
      createNode(x, y, halfWidth + 1, halfHeight + 1, level + 1),
      createNode(x + halfWidth - 1, y, halfWidth + 1, halfHeight + 1, level + 1),
      createNode(x, y + halfHeight - 1, halfWidth + 1, halfHeight + 1, level + 1),
      createNode(x + halfWidth - 1, y + halfHeight - 1, halfWidth + 1, halfHeight + 1, level + 1)
    ];

    return createBranchNode({ x, y, width, height }, children, level, maxLevel);
  };

  return createNode(0, 0, width, height, 0);
};

export function renderQuadTree(
  ctx: CanvasRenderingContext2D,
  node: QuadTreeNode,
  outlineColor: string,
  outlineWidth: number,
  removedRegions: { x: number; y: number; width: number; height: number }[],
  drawOutlines: boolean = true
) {
  if (node.children) {
    node.children.forEach(child => renderQuadTree(ctx, child, outlineColor, outlineWidth, removedRegions, drawOutlines));
  } else {
    // Check if region is not in removedRegions
    const isRemoved = removedRegions.some(region => 
      region.x === node.region.x && 
      region.y === node.region.y && 
      region.width === node.region.width && 
      region.height === node.region.height
    );
    
    if (!isRemoved) {
      // Draw the region's color
      ctx.fillStyle = `rgb(${node.color.r}, ${node.color.g}, ${node.color.b})`;
      ctx.fillRect(node.region.x, node.region.y, node.region.width, node.region.height);
      
      // Draw outline if enabled
      if (drawOutlines && outlineWidth > 0) {
        // Inset the outline by half the outline width to prevent overlap
        const inset = outlineWidth / 2;
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = outlineWidth;
        ctx.strokeRect(
          node.region.x + inset,
          node.region.y + inset,
          node.region.width - outlineWidth,
          node.region.height - outlineWidth
        );
      }
    }
  }
}

const createLeafNode = (region: Region, color: { r: number; g: number; b: number }, level: number, maxLevel: number): QuadTreeNode => ({
  region,
  color,
  children: null,
  level,
  maxLevel
});

const createBranchNode = (region: Region, children: QuadTreeNode[], level: number, maxLevel: number): QuadTreeNode => ({
  region,
  color: { r: 0, g: 0, b: 0 }, // This will be calculated
  children,
  level,
  maxLevel
});

export function findRegionsInBrush(node: QuadTreeNode, point: Point, radius: number): QuadTreeNode[] {
  const regions: QuadTreeNode[] = [];

  function isInBrush(region: Region): boolean {
    // Check if any corner of the region is within the brush radius
    const corners = [
      { x: region.x, y: region.y },
      { x: region.x + region.width, y: region.y },
      { x: region.x, y: region.y + region.height },
      { x: region.x + region.width, y: region.y + region.height }
    ];

    return corners.some(corner => {
      const dx = corner.x - point.x;
      const dy = corner.y - point.y;
      return (dx * dx + dy * dy) <= radius * radius;
    });
  }

  function traverse(node: QuadTreeNode) {
    if (isInBrush(node.region)) {
      if (node.children) {
        node.children.forEach(traverse);
      } else {
        regions.push(node);
      }
    }
  }

  traverse(node);
  return regions;
} 
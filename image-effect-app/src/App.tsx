import { useState, useEffect } from 'react'
import ImageUpload from './components/ImageUpload'
import ImagePreview from './components/ImagePreview'
import EffectControls from './components/EffectControls'
import { createQuadTree, renderQuadTree } from './utils/quadtree'
import './App.css'

type RevealMode = 'image' | 'grid';

function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [varianceThreshold, setVarianceThreshold] = useState(50)
  const [maxLevel, setMaxLevel] = useState(6)
  const [outlineColor, setOutlineColor] = useState('#FFFFFF')
  const [outlineWidth, setOutlineWidth] = useState(0.2)
  const [brushRadius, setBrushRadius] = useState(15)
  const [revealMode, setRevealMode] = useState<RevealMode>('image')

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
    if (!imageUrl) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.src = imageUrl

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height

      ctx.drawImage(img, 0, 0)
      const quadtree = createQuadTree(ctx, img.width, img.height, maxLevel, varianceThreshold)
      renderQuadTree(ctx, quadtree, outlineColor, outlineWidth)

      const link = document.createElement('a')
      link.download = 'processed-image.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
  }

  return (
    <div className="container">
      <div className="content">
        <header className="header">
          <h1 className="title">Quadtree Image Effect</h1>
          <p className="subtitle">Upload an image and apply quadtree pixelation with outlines</p>
        </header>

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

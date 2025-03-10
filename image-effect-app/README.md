# Quadtree Image Editor

![Quadtree Editor Preview](screenshot.jpg)

An interactive image editor that uses quadtree decomposition to create unique artistic effects. Built with React, TypeScript, and Vite.

## Features

- **Interactive Brush Tools:**
  - Add/Remove Image: Reveal or conceal portions of the image using quadtree decomposition
  - Add/Remove Grid: Apply or erase grid overlays
  - Add/Remove Color: Apply or remove color overlays with customizable blend modes

- **Quadtree Settings:**
  - Adjustable variance threshold for controlling decomposition sensitivity
  - Configurable maximum subdivision level
  - Real-time brush size preview

- **Color and Style Controls:**
  - Customizable grid colors and line thickness
  - Color overlay with multiple blend modes
  - Adjustable opacity settings

- **Editing Tools:**
  - Undo/Redo functionality
  - Reset to original state
  - Download modified image
  - Upload new images

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Built With

- React
- TypeScript
- Vite
- HTML Canvas API

## License

MIT License - feel free to use and modify for your own projects!

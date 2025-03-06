# Quadtree Image Effect

An interactive web application that applies a quadtree-based pixelation effect to images with customizable parameters and interactive reveal functionality.

## Features

- **Interactive Image Processing**: Upload any image and apply a quadtree-based pixelation effect
- **Customizable Parameters**:
  - Variance Threshold: Control the level of detail in the pixelation (0-2000)
  - Max Subdivision Level: Set the maximum depth of quadtree subdivisions (1-8)
  - Outline Color: Choose the color of the grid outlines
  - Outline Width: Adjust the thickness of the grid lines (0-3px)
  - Brush Size: Control the size of the reveal brush (5-50px)

- **Two Reveal Modes**:
  - **Image Mode**: Reveal the original image pixels while keeping the grid outlines
  - **Grid Mode**: Remove grid outlines while maintaining the pixelated effect

- **Interactive Controls**:
  - Click and drag to reveal/remove regions
  - Hover preview shows which regions will be affected
  - Visual brush cursor with adjustable size
  - Keyboard shortcuts for brush size adjustment (+/- keys)

- **Reset Functionality**: Easily reset all modifications and return to the original state

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/quadtree-image-effect.git
cd quadtree-image-effect
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Upload an Image**:
   - Click the upload area or drag and drop an image file
   - Supported formats: PNG, JPEG, GIF, etc.

2. **Adjust Parameters**:
   - Use the sliders and color picker to customize the effect
   - Changes are applied in real-time

3. **Interactive Reveal**:
   - Select a reveal mode (Image or Grid)
   - Click and drag over regions to reveal/remove effects
   - Use the +/- keys to adjust brush size
   - Hover over regions to preview the effect

4. **Reset and Download**:
   - Click "Reset" to clear all modifications
   - Click "Download Image" to save the processed image

## Technical Details

The application uses:
- React with TypeScript
- Canvas API for image processing
- Quadtree algorithm for adaptive pixelation
- CSS Modules for styling

The quadtree algorithm:
- Recursively subdivides the image into quadrants
- Calculates color variance in each region
- Subdivides further if variance exceeds threshold
- Maintains original color data for reveal functionality

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by quadtree-based image processing techniques
- Built with modern web technologies and best practices 
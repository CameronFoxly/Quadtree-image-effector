# Quadtree Image Effector

An interactive web application that applies quadtree-based effects to images, allowing users to selectively reveal the original image or grid structure through brushing interactions.

## Features

- **Image Upload**: Support for uploading and processing any image file
- **Interactive Brush Tools**: Two brush modes for interacting with the image:
  - Image Mode: Reveals the original image beneath the quadtree effect
  - Grid Mode: Shows grid structure with customizable outlines
- **Adjustable Parameters**:
  - Variance Threshold: Controls the detail level of the quadtree segmentation
  - Maximum Level: Sets the maximum depth of the quadtree subdivision
  - Outline Color: Customizable color for grid lines
  - Outline Width: Adjustable thickness of grid lines
  - Brush Size: Adjustable brush radius (use +/- keys or controls)
- **Real-time Preview**: See changes immediately as you adjust parameters
- **Download**: Export your processed image with all effects applied

## Controls

- **Mouse Controls**:
  - Click and drag to apply effects
  - Hover to preview affected areas
- **Keyboard Shortcuts**:
  - `+` or `=`: Increase brush size
  - `-` or `_`: Decrease brush size
- **UI Controls**:
  - Sliders for variance threshold and max level
  - Color picker for outline color
  - Slider for outline width
  - Brush size adjustment
  - Mode toggle between image and grid effects
  - Reset button to clear all effects
  - Download button to save the result

## Technical Details

The application uses a quadtree algorithm to analyze and segment the image based on color variance. Each region is subdivided until either:
- The variance threshold is met
- The maximum subdivision level is reached

The quadtree structure enables efficient region selection and manipulation, allowing for smooth real-time interactions even with large images.

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
4. Open your browser to the local development URL

## Usage

1. Upload an image using the upload button or drag-and-drop
2. Adjust the effect parameters using the control panel
3. Use the brush tool to reveal the original image or grid structure
4. Download the processed image when satisfied with the result

## Built With

- React
- TypeScript
- Vite
- HTML Canvas API

## Deployment

The application is deployed to GitHub Pages. You can access it at:
https://cameronfoxly.github.io/Quadtree-image-effector/

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by quadtree-based image processing techniques
- Built with modern web technologies and best practices 
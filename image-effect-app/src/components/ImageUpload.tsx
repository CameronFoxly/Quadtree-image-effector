import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from './ImageUpload.module.css';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
}

export default function ImageUpload({ onImageSelect }: ImageUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    // Validate file
    if (!file.type.startsWith('image/')) return;
    if (file.size === 0) return;

    onImageSelect(file);
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1
  });

  return (
    <div
      {...getRootProps()}
      className={`${styles.uploadContainer} ${isDragActive ? styles.dragActive : ''}`}
    >
      <input {...getInputProps()} />
      <div className={styles.uploadContent}>
        <svg
          className={styles.uploadIcon}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className={styles.uploadText}>
          {isDragActive
            ? 'Drop the image here'
            : 'Drag and drop an image here, or click to select'}
        </p>
        <p className={styles.uploadHint}>
          Supports JPG, PNG, GIF, and WebP
        </p>
      </div>
    </div>
  );
} 
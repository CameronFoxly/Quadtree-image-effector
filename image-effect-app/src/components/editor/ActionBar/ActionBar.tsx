import React from 'react';
import { Button } from '../../common/Button/Button';
import styles from './ActionBar.module.css';

interface ActionBarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onDownload: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onDownload
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <Button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          variant="action"
          icon="↶"
        >
          Undo
        </Button>
        <Button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          variant="action"
          icon="↷"
        >
          Redo
        </Button>
        <Button
          onClick={onReset}
          variant="action"
          title="Reset all changes"
        >
          Reset
        </Button>
      </div>
      <Button
        onClick={onDownload}
        variant="action"
        title="Download image"
        className={styles.downloadButton}
        active={true}
      >
        Download
      </Button>
    </div>
  );
};

export default ActionBar; 
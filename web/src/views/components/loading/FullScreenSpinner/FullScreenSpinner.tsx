import { isDefined } from '@railgun-community/shared-models';
import React from 'react';
import { Spinner } from '@components/loading/Spinner/Spinner';
import { Text } from '@components/Text/Text';
import styles from './FullScreenSpinner.module.scss';

interface FullScreenSpinnerProps {
  preventTouch?: boolean;
  text?: string;
}

export const FullScreenSpinner: React.FC<FullScreenSpinnerProps> = ({
  preventTouch = true,
  text,
}) => {
  return (
    <div
      className={styles.fullScreenSpinnerContainer}
      style={{ pointerEvents: preventTouch ? 'auto' : 'none' }}
    >
      <div className={styles.spinnerContainer}>
        <Spinner size={72} />
        {isDefined(text) && <Text className={styles.text}>{text}</Text>}
      </div>
    </div>
  );
};

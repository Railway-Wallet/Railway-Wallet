import React from 'react';
import { Slider } from '@components/Slider/Slider';
import { Text } from '@components/Text/Text';
import styles from './SlippageSelector.module.scss';

type Props = {
  slippagePercentage: number;
  slippageDisclaimer: string;
  setSlippagePercentage: React.Dispatch<React.SetStateAction<number>>;
};

export const SlippageSelector: React.FC<Props> = ({
  slippageDisclaimer,
  setSlippagePercentage,
  slippagePercentage,
}) => {
  return (
    <div>
      <Text className={styles.sectionHeader}>
        Slippage: <b>{(slippagePercentage * 100).toFixed(1)}</b> %
      </Text>
      <div className={styles.sliderContainer}>
        <Slider
          defaultValue={slippagePercentage}
          minValue={0.001}
          maxValue={0.2}
          step={0.001}
          updateValue={setSlippagePercentage}
        />
      </div>
      <Text className={styles.slippageDisclaimer}>{slippageDisclaimer}</Text>
    </div>
  );
};

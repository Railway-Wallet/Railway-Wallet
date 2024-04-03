import React, { useState } from 'react';
import { Button } from '@components/Button/Button';
import { Text } from '@components/Text/Text';
import { IconType } from '@services/util/icon-service';
import styles from './AppIntroView.module.scss';

type Props = {
  onComplete: () => void;
};

export const AppIntroView: React.FC<Props> = ({ onComplete }) => {
  const [stage, setStage] = useState(0);

  const getTextForStage = (stage: number) => {
    switch (stage) {
      case 0:
        return 'Welcome to Railway. The private DeFi wallet.';
      case 1:
        return 'This app is a standalone, non-custodial tool to help you interact with your tokens on the blockchain. Because you are always in control of your funds, it is critical that you save your seed phrase safely. There are no back ups.';
      case 2:
        return 'Railway Wallet takes privacy and anonymity seriously. This app exists solely on your device and does not store any data on centralized servers. It does not collect or send any analytics. You are in complete control and maintain sole responsibility of your data and funds at all times.';
    }

    return '';
  };

  const getButtonTextForStage = (stage: number) => {
    switch (stage) {
      case 0:
        return 'Continue';
      case 1:
        return 'Continue';
      case 2:
        return "Let's go!";
    }

    return '';
  };

  const onButtonClick = () => {
    if (stage === 2) {
      onComplete();
    } else {
      setStage(stage + 1);
    }
  };

  return (
    <div className={styles.textWrapper}>
      <>
        <Text className={styles.mainText}>{getTextForStage(stage)}</Text>
        <div className={styles.buttonContainer}>
          <Button
            endIcon={stage < 2 ? IconType.ChevronRight : undefined}
            children={getButtonTextForStage(stage)}
            onClick={onButtonClick}
            buttonClassName={styles.buttonStyles}
          />
        </div>
      </>
    </div>
  );
};

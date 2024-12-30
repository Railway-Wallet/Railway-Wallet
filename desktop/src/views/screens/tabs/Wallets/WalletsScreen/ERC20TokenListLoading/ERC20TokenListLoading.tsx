import { isDefined } from '@railgun-community/shared-models';
import React from 'react';
import { Text } from '@components/Text/Text';
import { Spinner } from '@views/components/loading/Spinner/Spinner';
import styles from './ERC20TokenListLoading.module.scss';

type Props = {
  title: string;
  progress?: number;
};

export const ERC20TokenListLoading: React.FC<Props> = ({ title, progress }) => {
  const text = isDefined(progress)
    ? `${title}: ${(progress * 100).toFixed(0)}%`
    : title;

  return (
    <div className={styles.scanContainer}>
      <Spinner size={20} />
      <div>
        <Text className={styles.scanText}>{text}</Text>
      </div>
    </div>
  );
};

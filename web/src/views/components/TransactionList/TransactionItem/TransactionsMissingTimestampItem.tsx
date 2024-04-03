import React from 'react';
import { Text } from '@components/Text/Text';
import { SavedTransaction, styleguide, useReduxSelector } from '@react-shared';
import { TextButton } from '@views/components/TextButton/TextButton';
import styles from './TransactionItem.module.scss';

type Props = {
  transactions: SavedTransaction[];
  resyncTransactions: () => Promise<void>;
};

export const TransactionsMissingTimestampItem: React.FC<Props> = ({
  transactions,
  resyncTransactions,
}) => {
  const { wallets } = useReduxSelector('wallets');
  const transactionCount = transactions.length;

  if (!wallets.active || !transactionCount || transactionCount === 0) {
    return null;
  }

  const message =
    transactionCount > 1
      ? `${transactionCount} transactions need to retrieve timestamps from on-chain data.`
      : `${transactionCount} transaction needs to retrieve timestamps from on-chain data.`;

  return (
    <div className={styles.transactionItemWrapper}>
      <div className={styles.leftViewContainer}>
        <div className={styles.statusContainer}>
          <div
            className={styles.statusIndicator}
            style={{
              backgroundColor: styleguide.colors.txRed(),
            }}
          />
          <Text className={styles.statusText}>MISSING DATA</Text>
        </div>
        <Text className={styles.transactionText}>{message}</Text>
        <div className={styles.footerWrapper}>
          <TextButton
            action={resyncTransactions}
            text="Try to re-sync transactions"
            containerClassName={styles.bottomActionButton}
          />
        </div>
      </div>
    </div>
  );
};

import { isDefined } from '@railgun-community/shared-models';
import { Text } from '@components/Text/Text';
import {
  ERC20Token,
  SavedTransaction,
  useTransactionSearch,
} from '@react-shared';
import { TransactionItem } from './TransactionItem/TransactionItem';
import { TransactionsMissingTimestampItem } from './TransactionItem/TransactionsMissingTimestampItem';
import styles from './TransactionList.module.scss';

type Props = {
  transactionsMissingTimestamp: SavedTransaction[];
  transactions: SavedTransaction[];
  resyncTransactions: () => Promise<void>;
  filteredToken?: ERC20Token;
  searchText?: string;
  isRailgunForTokenInfo?: boolean;
  generatePOIs?: () => void;
  refreshPOILists?: () => void;
  poiRequired: boolean;
};

export const TransactionList: React.FC<Props> = ({
  transactionsMissingTimestamp,
  transactions,
  resyncTransactions,
  filteredToken,
  searchText,
  isRailgunForTokenInfo = false,
  generatePOIs,
  refreshPOILists,
  poiRequired,
}) => {
  const { filteredTransactions } = useTransactionSearch(
    transactions,
    isRailgunForTokenInfo,
    searchText,
  );

  const renderTransaction = (transaction: SavedTransaction, index: number) => {
    return (
      <TransactionItem
        transaction={transaction}
        key={index}
        filteredToken={filteredToken}
        isRailgunForTokenInfo={isRailgunForTokenInfo}
        generatePOIs={generatePOIs}
        refreshPOILists={refreshPOILists}
        poiRequired={poiRequired}
      />
    );
  };

  const allNetworkTransactionsLength = [
    ...transactionsMissingTimestamp,
    ...transactions,
  ].length;

  return (
    <>
      {!isDefined(searchText) ||
        (searchText === '' && (
          <TransactionsMissingTimestampItem
            resyncTransactions={resyncTransactions}
            transactions={transactionsMissingTimestamp}
          />
        ))}
      {filteredTransactions.map(renderTransaction)}
      {allNetworkTransactionsLength === 0 && (
        <div className={styles.placeholder}>
          <Text className={styles.placeholderText}>No transactions yet.</Text>
        </div>
      )}
      {allNetworkTransactionsLength > 0 &&
        filteredTransactions.length === 0 && (
          <div className={styles.placeholder}>
            <Text className={styles.placeholderText}>
              No transaction found.
            </Text>
          </div>
        )}
    </>
  );
};

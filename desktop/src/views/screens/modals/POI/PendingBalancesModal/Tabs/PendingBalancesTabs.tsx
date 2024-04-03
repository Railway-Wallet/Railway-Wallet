import cn from 'classnames';
import { Text } from '@components/Text/Text';
import { PendingBalancesModalTabOption } from '../PendingBalancesModal';
import styles from './PendingBalancesTabs.module.scss';

interface PendingBalancesTabsProps {
  selectedTab: PendingBalancesModalTabOption;
  setSelectedTab: (tab: PendingBalancesModalTabOption) => void;
  showRestrictedTab: boolean;
}

export const PendingBalancesTabs = ({
  selectedTab,
  setSelectedTab,
  showRestrictedTab,
}: PendingBalancesTabsProps) => {
  const allTabs = Object.values(PendingBalancesModalTabOption).filter(
    tab =>
      showRestrictedTab || tab !== PendingBalancesModalTabOption.Restricted,
  );

  return (
    <div className={styles.poiTabContainer}>
      {allTabs.map(tab => (
        <div
          key={tab}
          className={cn(styles.poiTab, {
            [styles.poiTabSelected]: tab === selectedTab,
          })}
          onClick={() => setSelectedTab(tab)}
        >
          <Text className={styles.poiTabText}>{tab}</Text>
        </div>
      ))}
    </div>
  );
};

import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { Text } from '@components/Text/Text';
import { styleguide } from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import styles from './NFTListHeader.module.scss';

type Props = {
  isRailgun: boolean;
  refreshBalances: () => void;
  onSearchChange: (searchText: string) => void;
};

export const NFTListHeader = ({
  isRailgun,
  onSearchChange,
  refreshBalances,
}: Props) => {
  return (
    <div className={styles.innerContainer}>
      <div className={styles.titleAndIcon}>
        <Text fontSize={18} fontWeight={900} className={styles.headerText}>
          {isRailgun ? 'Shielded' : 'Public'} NFTs
        </Text>
        {renderIcon(
          isRailgun ? IconType.Shield : IconType.Public,
          20,
          styleguide.colors.lighterLabelSecondary,
        )}
      </div>
      <div className={styles.searchAndButtons}>
        <Button
          buttonClassName={styles.button}
          endIcon={IconType.Refresh}
          alt="refresh balances"
          onClick={refreshBalances}
          iconOnly
        />
        <Input
          onChange={e => onSearchChange(e.target.value)}
          startIcon={IconType.Search}
          placeholder="Search"
          height={38}
        />
        {}
      </div>
    </div>
  );
};

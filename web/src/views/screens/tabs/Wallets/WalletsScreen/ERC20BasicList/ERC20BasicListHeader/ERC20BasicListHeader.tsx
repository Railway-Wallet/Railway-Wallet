import { isDefined } from '@railgun-community/shared-models';
import { ReactNode } from 'react';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { Text } from '@components/Text/Text';
import { DrawerName, EVENT_OPEN_DRAWER_WITH_DATA } from '@models/drawer-types';
import { styleguide } from '@react-shared';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { IconType, renderIcon } from '@services/util/icon-service';
import styles from './ERC20BasicListHeader.module.scss';

type Props = {
  isRailgun: boolean;
  showAddTokens?: boolean;
  searchText?: string;
  refreshBalances: () => void;
  onSearchChange: (searchText: string) => void;
  customTitle?: ReactNode;
  customRightGroupStartView?: ReactNode;
  customRightGroupEndView?: ReactNode;
};

export const ERC20BasicListHeader = ({
  isRailgun,
  onSearchChange,
  refreshBalances,
  customTitle,
  customRightGroupStartView,
  customRightGroupEndView,
  showAddTokens = true,
  searchText,
}: Props) => {
  const handleOpenAddToken = () => {
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.AddTokens,
    });
  };

  return (
    <div className={styles.innerContainer}>
      {isDefined(customTitle) ? (
        customTitle
      ) : (
        <div className={styles.titleAndIcon}>
          <Text fontSize={18} fontWeight={900} className={styles.headerText}>
            {isRailgun ? 'Shielded' : 'Public'} tokens
          </Text>
          {renderIcon(
            isRailgun ? IconType.Shield : IconType.Public,
            20,
            styleguide.colors.lighterLabelSecondary,
          )}
        </div>
      )}
      <div className={styles.rightGroup}>
        <Input
          onChange={e => onSearchChange(e.target.value)}
          startIcon={IconType.Search}
          placeholder="Search"
          height={38}
          value={searchText}
        />
        {customRightGroupStartView}
        <Button
          buttonClassName={styles.button}
          endIcon={IconType.Refresh}
          alt="refresh balances"
          onClick={refreshBalances}
          iconOnly
        />
        {showAddTokens && (
          <Button
            buttonClassName={styles.button}
            endIcon={IconType.Plus}
            alt="add tokens"
            onClick={handleOpenAddToken}
            iconOnly
          />
        )}
        {customRightGroupEndView}
      </div>
    </div>
  );
};

import { isDefined } from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import cn from 'classnames';
import { Text } from '@components/Text/Text';
import { dAppsRoutes } from '@models/dApps';
import { styleguide } from '@react-shared';
import {
  getTabFromTabRoute,
  TabRoute,
} from '@root/App/TabNavigator/TabContainer/TabContainer';
import { Tab } from '@root/App/TabNavigator/TabNavigator';
import { IconType, renderIcon } from '@services/util/icon-service';
import { DAppsModal } from '@views/screens/modals/DAppsModal/DAppsModal';
import styles from './TabOption.module.scss';

export type TabOptionType = {
  icon: IconType;
  iconSize?: number;
  href?: string;
  tab: Tab;
  disabled?: boolean;
  badge?: number;
  small?: boolean;
};

export const TabOption = ({
  icon,
  iconSize = 32,
  href,
  tab,
  disabled = false,
  badge,
  small = false,
}: TabOptionType) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname as TabRoute;
  const [selected, setSelected] = useState(false);
  const [openDappsModal, setOpenDappsModal] = useState(false);
  const [selectedDAppRoute, setSelectedDAppRoute] = useState<TabRoute>();
  const isDAppsTab = tab === Tab.DApps;

  useEffect(() => {
    if (pathname === href) {
      setSelected(true);
    } else if (isDAppsTab && dAppsRoutes.includes(pathname)) {
      setSelected(true);
      setSelectedDAppRoute(pathname);
    } else {
      setSelected(false);
      setSelectedDAppRoute(undefined);
    }
  }, [href, pathname, setSelectedDAppRoute, isDAppsTab]);

  const getIconColor = () => {
    if (disabled) {
      return styleguide.colors.gray7(0.5);
    }
    if (selected) {
      return styleguide.colors.white;
    }
    return styleguide.colors.gray7();
  };

  const handleOnClick = () => {
    if (isDefined(href)) {
      navigate(href);
    } else {
      setOpenDappsModal(true);
    }
  };

  return (
    <>
      <div
        onClick={handleOnClick}
        className={cn(styles.sidebarLinkContainer, {
          [styles.selectedLink]: !disabled && selected,
          [styles.disabled]: disabled,
          [styles.sidebarLinkContainerSmall]: small,
        })}
      >
        {renderIcon(icon, iconSize, getIconColor())}
        {!small && (
          <div className={cn(styles.link, { [styles.disabled]: disabled })}>
            <Text
              className={cn(styles.text, {
                [styles.enabledText]: !disabled && selected,
                [styles.disabledText]: disabled,
              })}
            >
              {tab}
              {isDefined(selectedDAppRoute) && (
                <Text className={styles.selectedDApp}>
                  {getTabFromTabRoute(selectedDAppRoute)}
                </Text>
              )}
            </Text>
            {isDefined(badge) && (
              <div className={styles.badgeContainer}>
                <Text className={styles.badge}>{badge}</Text>
              </div>
            )}
          </div>
        )}
      </div>
      {openDappsModal && (
        <DAppsModal onClose={() => setOpenDappsModal(false)} />
      )}
    </>
  );
};

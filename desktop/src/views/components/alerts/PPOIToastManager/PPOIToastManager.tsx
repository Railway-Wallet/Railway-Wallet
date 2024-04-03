import { useLocation } from 'react-router-dom';
import cn from 'classnames';
import {
  getTabFromTabRoute,
  TabRoute,
} from '@root/App/TabNavigator/TabContainer/TabContainer';
import { Tab } from '@root/App/TabNavigator/TabNavigator';
import { PPOIToast } from '../PPOIToast/PPOIToast';
import { ShieldPPOICountdownToast } from '../ShieldPPOICountdownToast/ShieldPPOICountdownToast';
import styles from './PPOIToastManager.module.scss';

export const PPOIToastManager: React.FC = () => {
  const location = useLocation();
  const currentTab = getTabFromTabRoute(
    location.pathname.toLowerCase() as TabRoute,
  );

  const shouldShowLessPadding = (currentTab: Tab) => {
    switch (currentTab) {
      case Tab.RailwayDEX:
      case Tab.Farm:
      case Tab.Activity:
      case Tab.Liquidity:
      case Tab.DApps:
        return true;

      case Tab.NFTs:
      case Tab.Wallets:
        return false;
    }
  };

  return (
    <div
      className={cn(styles.toastWrapper, {
        [styles.wrapperMinorPadding]: shouldShowLessPadding(currentTab),
      })}
    >
      <ShieldPPOICountdownToast />
      <PPOIToast />
    </div>
  );
};

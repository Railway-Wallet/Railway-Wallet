import React from 'react';
import { useLocation } from 'react-router-dom';
import { Tab } from '../TabNavigator';
import styles from './TabContainer.module.scss';

type Props = {
  childTab: Tab;
  children: React.ReactNode;
};

export enum TabRoute {
  Wallets = '/',
  Activity = '/activity',
  NFTs = '/nfts',
  DApps = '/dapps',

  Swap = '/swap',
  Farm = '/farm',
  Liquidity = '/liquidity',
}

export const getTabFromTabRoute = (route: TabRoute) => {
  switch (route) {
    case TabRoute.Wallets:
      return Tab.Wallets;
    case TabRoute.Activity:
      return Tab.Activity;
    case TabRoute.NFTs:
      return Tab.NFTs;
    case TabRoute.DApps:
      return Tab.DApps;

    case TabRoute.Swap:
      return Tab.RailwayDEX;
    case TabRoute.Farm:
      return Tab.Farm;
    case TabRoute.Liquidity:
      return Tab.Liquidity;
  }
};

export const TabContainer: React.FC<Props> = ({ childTab, children }) => {
  const location = useLocation();

  const getCurrentTab = () => {
    return getTabFromTabRoute(location.pathname.toLowerCase() as TabRoute);
  };

  return (
    <div
      className={styles.tabContentContainer}
      style={{ display: getCurrentTab() === childTab ? 'flex' : 'none' }}
    >
      {children}
    </div>
  );
};

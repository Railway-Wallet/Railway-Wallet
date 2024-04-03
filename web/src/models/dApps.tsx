import { TabRoute } from '@root/App/TabNavigator/TabContainer/TabContainer';
import { IconType } from '@services/util/icon-service';

export type DApp = {
  name: string;
  description: string;
  icon: IconType | string;
  href: TabRoute;
  enabled: boolean;
};

export const dAppsRoutes = [TabRoute.Swap, TabRoute.Farm, TabRoute.Liquidity];

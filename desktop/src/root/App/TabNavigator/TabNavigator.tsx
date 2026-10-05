import React, { useEffect, useMemo, useState } from 'react';
import { DrawerManager } from '@components/Drawer/DrawerManager/DrawerManager';
import {
  refreshRailgunBalances,
  useAppBalancePriceUpdater,
  useReduxSelector,
  useShouldEnableNFTs,
  useVaultRedeemTokenPriceUpdater,
} from '@react-shared';
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from '@screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import { ActivityScreen } from '@screens/tabs/Activity/ActivityScreen';
import { EphemeralAccountsScreen } from '@screens/tabs/EphemeralAccounts/EphemeralAccountsScreen';
import { FarmScreen } from '@screens/tabs/Farm/FarmScreen';
import { FxMintScreen } from '@screens/tabs/FxMint/FxMintScreen';
import { MorphoVaultsScreen } from '@screens/tabs/MorphoVaults/MorphoVaultsScreen';
import { NFTsScreenContainer } from '@screens/tabs/NFTs/NFTsScreenContainer';
import { SwapScreen } from '@screens/tabs/Swap/SwapScreen';
import { WalletsScreenContainer } from '@screens/tabs/Wallets/WalletsScreenContainer';
import {
  AppEventChangePrivatePublicData,
  AppEventData,
  appEventsBus,
  EVENT_CHANGE_PRIVATE_PUBLIC,
} from '@services/navigation/app-events';
import { LiquidityScreen } from '@views/screens/tabs/Liquidity/LiquidityScreen';
import { Constants } from '../../../utils/constants';
import { TabContainer } from './TabContainer/TabContainer';

export enum Tab {
  Wallets = 'Wallets',
  Activity = 'Activity',
  NFTs = 'NFTs',
  DApps = 'dApps',
  EphemeralAccounts = 'Ephemeral Accounts',

  RailwayDEX = 'Railway DEX',
  Liquidity = 'Liquidity',
  Farm = 'Farm',
  FxMint = 'fxMINT',
  MorphoVaults = 'Morpho Vaults',
}

export const TabNavigator: React.FC = () => {
  const { wallets } = useReduxSelector('wallets');

  const [isRailgun, setIsRailgun] = useState(true);
  const [errorModal, setErrorModal] = useState<
    ErrorDetailsModalProps | undefined
  >(undefined);

  const { shouldEnableNFTs } = useShouldEnableNFTs();

  const changePrivatePublic = (data: AppEventData) => {
    setIsRailgun((data as AppEventChangePrivatePublicData).isRailgun);
  };

  useAppBalancePriceUpdater(refreshRailgunBalances, (error: Error) =>
    setErrorModal({
      error,
      onDismiss: () => setErrorModal(undefined),
    }),
  );

  useVaultRedeemTokenPriceUpdater();

  useEffect(() => {
    appEventsBus.on(EVENT_CHANGE_PRIVATE_PUBLIC, changePrivatePublic);
    return () => {
      appEventsBus.remove(EVENT_CHANGE_PRIVATE_PUBLIC, changePrivatePublic);
    };
  }, []);

  const isRailgunOverride =
    wallets.active?.isViewOnlyWallet ?? false ? true : isRailgun;

  return useMemo(
    () => (
      <>
        <DrawerManager isRailgun={isRailgunOverride} />
        <TabContainer childTab={Tab.Wallets}>
          <WalletsScreenContainer
            isRailgun={isRailgunOverride}
            setIsRailgun={setIsRailgun}
          />
        </TabContainer>
        <TabContainer childTab={Tab.Activity}>
          <ActivityScreen />
        </TabContainer>
        <TabContainer childTab={Tab.RailwayDEX}>
          <SwapScreen
            isRailgun={isRailgunOverride}
            setIsRailgun={setIsRailgun}
          />
        </TabContainer>
        {Constants.SHOW_FARM_FEATURE && (
          <TabContainer childTab={Tab.Farm}>
            <FarmScreen />
          </TabContainer>
        )}
        <TabContainer childTab={Tab.Liquidity}>
          <LiquidityScreen />
        </TabContainer>
        <TabContainer childTab={Tab.EphemeralAccounts}>
          <EphemeralAccountsScreen />
        </TabContainer>
        <TabContainer childTab={Tab.FxMint}>
          <FxMintScreen />
        </TabContainer>
        <TabContainer childTab={Tab.MorphoVaults}>
          <MorphoVaultsScreen />
        </TabContainer>
        {shouldEnableNFTs && (
          <TabContainer childTab={Tab.NFTs}>
            <NFTsScreenContainer
              isRailgun={isRailgunOverride}
              setIsRailgun={setIsRailgun}
            />
          </TabContainer>
        )}
        {errorModal && <ErrorDetailsModal {...errorModal} />}
      </>
    ),
    [isRailgunOverride, shouldEnableNFTs],
  );
};

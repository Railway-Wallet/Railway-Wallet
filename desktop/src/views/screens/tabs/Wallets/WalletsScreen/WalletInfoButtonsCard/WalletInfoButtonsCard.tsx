import {
  isDefined,
  RailgunWalletBalanceBucket,
  WalletCreationType,
} from '@railgun-community/shared-models';
import { useState } from 'react';
import { CardBackground } from '@components/CardBackground/CardBackground';
import { ShortCopyableAddress } from '@components/ShortCopyableAddress/ShortCopyableAddress';
import { Text } from '@components/Text/Text';
import { DrawerName, EVENT_OPEN_DRAWER_WITH_DATA } from '@models/drawer-types';
import {
  AppSettingsService,
  formatNumberToLocaleWithMinDecimals,
  MINTABLE_TEST_TOKEN_ROPSTEN,
  usePendingBalancePriceLabel,
  usePOIRequiredForCurrentNetwork,
  useTotalBalanceCurrency,
  WalletCardSlideItem,
} from '@react-shared';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { hasPassword } from '@services/security/password-service';
import { PendingBalancesModal } from '@views/screens/modals/POI/PendingBalancesModal/PendingBalancesModal';
import { WalletActionButtons } from '../WalletActionButtons/WalletActionButtons';
import { TokenActionType } from '../WalletsScreen';
import styles from './WalletInfoButtonsCard.module.scss';

type Props = {
  slideItem: WalletCardSlideItem;
  showCreatePassword: (walletCreationType: WalletCreationType) => void;
  showCreateWallet: () => void;
  showImportWallet: () => void;
  setShowWalletSelectorModal: (show: boolean) => void;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
  discreet: boolean;
};

export const WalletInfoButtonsCard = ({
  slideItem,
  showCreatePassword,
  showCreateWallet,
  showImportWallet,
  setShowWalletSelectorModal,
  balanceBucketFilter,
  discreet,
}: Props) => {
  const { poiRequired } = usePOIRequiredForCurrentNetwork();
  const { isRailgun, walletName, walletAddress } = slideItem;
  const { pendingBalancePriceLabel } = usePendingBalancePriceLabel(isRailgun);
  const { totalBalanceCurrency: spendableBalanceCurrency } =
    useTotalBalanceCurrency(isRailgun, balanceBucketFilter);

  const [showPendingBalancesModal, setShowPendingBalancesModal] =
    useState(false);
  const handleOpenActionModal = async (type: TokenActionType) => {
    switch (type) {
      case TokenActionType.SEND_TOKENS:
        return drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
          drawerName: DrawerName.SendERC20s,
        });
      case TokenActionType.RECEIVE_TOKENS:
        return drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
          drawerName: DrawerName.ReceiveTokens,
        });
      case TokenActionType.SHIELD_TOKENS:
        return drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
          drawerName: DrawerName.ShieldERC20s,
        });
      case TokenActionType.UNSHIELD_TOKENS:
        return drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
          drawerName: DrawerName.UnshieldERC20s,
        });
      case TokenActionType.CREATE_WALLET:
        if (!(await hasPassword())) {
          return showCreatePassword(WalletCreationType.Create);
        }
        return showCreateWallet();
      case TokenActionType.IMPORT_WALLET:
        if (!(await hasPassword())) {
          return showCreatePassword(WalletCreationType.Import);
        }
        return showImportWallet();
      case TokenActionType.MINT_TEST_TOKENS:
        return drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
          drawerName: DrawerName.MintERC20s,
          extraData: {
            erc20Amount: {
              token: MINTABLE_TEST_TOKEN_ROPSTEN,
              amountString: (10n ** 21n).toString(),
            },
          },
        });
    }
  };

  let spendableBalancePriceLabel = 'N/A';
  if (isDefined(spendableBalanceCurrency)) {
    if (spendableBalanceCurrency > 0 && spendableBalanceCurrency < 0.01) {
      spendableBalancePriceLabel = '0.00';
    } else {
      spendableBalancePriceLabel = formatNumberToLocaleWithMinDecimals(
        spendableBalanceCurrency,
        2,
      );
    }
  }
  if (discreet) {
    spendableBalancePriceLabel = '***';
  }

  return (
    <>
      <CardBackground cardBackgroundOpacity={0.3}>
        <div className={styles.cardContentContainer}>
          <div onClick={() => setShowWalletSelectorModal(true)}>
            <Text fontWeight={800} fontSize={24} className={styles.walletTitle}>
              {walletName}
            </Text>
          </div>
          <div className={styles.addressContainer}>
            <ShortCopyableAddress
              isRailgun={isRailgun}
              address={walletAddress}
            />
          </div>
          <Text className={styles.walletBalance} fontWeight={800} fontSize={64}>
            <span className={styles.currencySymbol}>
              {AppSettingsService.currency.symbol}
            </span>
            {spendableBalancePriceLabel}
          </Text>
          {isRailgun && poiRequired && isDefined(pendingBalancePriceLabel) && (
            <Text
              className={styles.pendingBalance}
              onClick={() => {
                setShowPendingBalancesModal(true);
              }}
            >
              *Pending balances: {pendingBalancePriceLabel}
            </Text>
          )}
          <WalletActionButtons
            handleOpenActionModal={handleOpenActionModal}
            isRailgun={isRailgun}
          />
        </div>
      </CardBackground>
      {showPendingBalancesModal && (
        <PendingBalancesModal
          onClose={() => {
            setShowPendingBalancesModal(false);
          }}
        />
      )}
    </>
  );
};

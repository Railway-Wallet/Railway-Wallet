import {
  isDefined,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import React, { useMemo, useState } from 'react';
import { CardBackground } from '@components/CardBackground/CardBackground';
import { Text } from '@components/Text/Text';
import {
  compareTokenAddress,
  ERC20Token,
  usePendingBalancePriceLabel,
  usePOIRequiredForCurrentNetwork,
  useReduxSelector,
  useWalletTokenVaultsFilter,
  WalletCardSlideItem,
} from '@react-shared';
import { Constants } from '@utils/constants';
import { PendingBalancesModal } from '@views/screens/modals/POI/PendingBalancesModal/PendingBalancesModal';
import { WalletCardSlideButtons } from '../WalletCardSlide/WalletCardSlideButtons/WalletCardSlideButtons';
import { WalletCardSlideFooter } from '../WalletCardSlide/WalletCardSlideFooter/WalletCardSlideFooter';
import { ERC20CardBalance } from './ERC20CardBalance/ERC20CardBalance';
import styles from '../ERC20Info.module.scss';

type Props = {
  token: ERC20Token;
  tokenPrice: Optional<number>;
  isRailgun: boolean;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
  onActionCreateWallet: () => void;
  onActionImportWallet: () => void;
  onActionUnshieldERC20s: () => void;
  onActionShieldERC20s: () => void;
  onActionSendERC20s: () => void;
  onActionReceiveTokens: () => void;
  onActionSwapERC20s: () => void;
  onActionFarmERC20s: (isRedeem: boolean) => void;
};

export const ERC20Card: React.FC<Props> = ({
  token,
  tokenPrice,
  isRailgun,
  balanceBucketFilter,
  onActionCreateWallet,
  onActionImportWallet,
  onActionUnshieldERC20s,
  onActionShieldERC20s,
  onActionSendERC20s,
  onActionReceiveTokens,
  onActionSwapERC20s,
  onActionFarmERC20s,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { poiRequired } = usePOIRequiredForCurrentNetwork();
  const { pendingBalancePriceLabel } = usePendingBalancePriceLabel(
    isRailgun,
    token,
  );

  const [showPendingBalancesModal, setShowPendingBalancesModal] =
    useState(false);

  const activeWallet = wallets.active;
  const hasWallet = wallets.available.length > 0;

  const networkName = network.current.name;
  const { availableDepositTokens, availableRedeemTokens } =
    useWalletTokenVaultsFilter(activeWallet, networkName);
  const { isDepositToken, isRedeemToken } = useMemo(() => {
    if (token.isAddressOnly === true) {
      return { isDepositToken: false, isRedeemToken: false };
    }

    const isDepositToken = availableDepositTokens.some(t =>
      compareTokenAddress(t.address, token.address),
    );

    const isRedeemToken = availableRedeemTokens.some(t =>
      compareTokenAddress(t.address, token.address),
    );

    return { isDepositToken, isRedeemToken };
  }, [availableDepositTokens, availableRedeemTokens, token]);

  const getFarmButtonText = () => {
    if (!Constants.SHOW_FARM_FEATURE) return;

    if (!isRailgun)
      return;

    if (isDepositToken) {
      return 'Farm';
    }
    if (isRedeemToken) {
      return 'Redeem';
    }
    return undefined;
  };

  const item: WalletCardSlideItem =
    isRailgun || (isDefined(activeWallet) && activeWallet.isViewOnlyWallet)
      ? {
          walletAddress: activeWallet?.railAddress,
          walletName: activeWallet?.name ?? 'RAILGUN',
          isRailgun: true,
        }
      : {
          walletAddress: activeWallet?.ethAddress,
          walletName: activeWallet?.name ?? `${network.current.publicName}`,
          isRailgun: false,
        };

  return (
    <>
      <CardBackground cardBackgroundOpacity={0.5}>
        <ERC20CardBalance
          token={token}
          tokenPrice={tokenPrice}
          isRailgun={isRailgun}
          balanceBucketFilter={balanceBucketFilter}
        />
        {isRailgun && poiRequired && isDefined(pendingBalancePriceLabel) && (
          <Text
            className={styles.pendingBalance}
            onClick={() => {
              setShowPendingBalancesModal(true);
            }}
          >
            Pending balance: {pendingBalancePriceLabel}
          </Text>
        )}
        <WalletCardSlideButtons
          hasWallet={hasWallet}
          item={item}
          farmButtonText={getFarmButtonText()}
          onActionCreateWallet={onActionCreateWallet}
          onActionImportWallet={onActionImportWallet}
          onActionUnshieldERC20s={onActionUnshieldERC20s}
          onActionShieldERC20s={onActionShieldERC20s}
          onActionSendERC20s={onActionSendERC20s}
          onActionReceiveTokens={onActionReceiveTokens}
          onActionSwapERC20s={onActionSwapERC20s}
          onActionFarmERC20s={() => {
            onActionFarmERC20s(isRedeemToken);
          }}
        />
        <WalletCardSlideFooter
          item={item}
          onActionShieldERC20s={onActionShieldERC20s}
          onActionUnshieldERC20s={onActionUnshieldERC20s}
        />
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

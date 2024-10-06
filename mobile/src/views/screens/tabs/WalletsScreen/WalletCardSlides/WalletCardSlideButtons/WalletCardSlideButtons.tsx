import { NetworkName } from "@railgun-community/shared-models";
import React, { useMemo } from "react";
import { View } from "react-native";
import { ButtonWithTextAndIcon } from "@components/buttons/ButtonWithTextAndIcon/ButtonWithTextAndIcon";
import {
  compareTokenAddress,
  ERC20Token,
  MINTABLE_TEST_TOKEN_ROPSTEN,
  useReduxSelector,
  useShouldEnableSwaps,
  useWalletTokenVaultsFilter,
  WalletCardSlideItem,
} from "@react-shared";
import { isIOS } from "@services/util/platform-os-service";
import { styles } from "./styles";

type Props = {
  hasWallet: boolean;
  item: WalletCardSlideItem;
  token?: ERC20Token;
  onActionCreateWallet: () => void;
  onActionImportWallet: () => void;
  onActionUnshieldERC20s: () => void;
  onActionShieldTokens: () => void;
  onActionSendERC20s: () => void;
  onActionSwapTokens?: () => void;
  onActionFarmERC20s?: (isRedeem: boolean) => void;
  onActionReceiveTokens: () => void;
  onActionMintTokens: () => void;
};

export const WalletCardSlideButtons: React.FC<Props> = ({
  hasWallet,
  item,
  token,
  onActionCreateWallet,
  onActionImportWallet,
  onActionSendERC20s,
  onActionSwapTokens,
  onActionFarmERC20s,
  onActionReceiveTokens,
  onActionMintTokens,
}) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const activeWallet = wallets.active;

  const swapsUnavailableOnPlatform = isIOS();
  const { shouldEnableSwaps } = useShouldEnableSwaps(
    swapsUnavailableOnPlatform
  );

  const isMintableTestToken =
    !token || token.address === MINTABLE_TEST_TOKEN_ROPSTEN.address;
  const canMintTestTokens =
    network.current.name === NetworkName.EthereumRopsten_DEPRECATED &&
    !item.isRailgun &&
    isMintableTestToken;

  const buttonsNoWallet = () => {
    return (
      <>
        <ButtonWithTextAndIcon
          icon={"plus"}
          title="Create"
          onPress={onActionCreateWallet}
          additionalStyles={styles.button}
        />
        <ButtonWithTextAndIcon
          icon={"arrow-down"}
          title="Import"
          onPress={onActionImportWallet}
          additionalStyles={styles.button}
        />
      </>
    );
  };

  const networkName = network.current.name;
  const { availableDepositTokens, availableRedeemTokens } =
    useWalletTokenVaultsFilter(activeWallet, networkName);
  const { isDepositToken, isRedeemToken } = useMemo(() => {
    if (!token || token.isAddressOnly === true) {
      return { isDepositToken: false, isRedeemToken: false };
    }

    const isDepositToken = availableDepositTokens.some((t) =>
      compareTokenAddress(t.address, token.address)
    );

    const isRedeemToken = availableRedeemTokens.some((t) =>
      compareTokenAddress(t.address, token.address)
    );

    return { isDepositToken, isRedeemToken };
  }, [availableDepositTokens, availableRedeemTokens, token]);

  const farmButtonText = !item.isRailgun
    ? undefined
    : isDepositToken
    ? "Farm"
    : isRedeemToken
    ? "Redeem"
    : undefined;

  const buttonsActiveWallet = () => {
    return (
      <>
        <ButtonWithTextAndIcon
          icon={"upload-outline"}
          title="Send"
          onPress={onActionSendERC20s}
          additionalStyles={styles.button}
          disabled={activeWallet?.isViewOnlyWallet}
        />
        <ButtonWithTextAndIcon
          icon={"download-outline"}
          title="Receive"
          onPress={onActionReceiveTokens}
          additionalStyles={styles.button}
        />
        {onActionFarmERC20s && farmButtonText && (
          <ButtonWithTextAndIcon
            icon="tractor-variant"
            title={farmButtonText}
            onPress={() => onActionFarmERC20s(isRedeemToken)}
            additionalStyles={styles.button}
          />
        )}
        {onActionSwapTokens && (
          <ButtonWithTextAndIcon
            icon={"swap-vertical"}
            title="Swap"
            onPress={onActionSwapTokens}
            additionalStyles={styles.button}
            disabled={!shouldEnableSwaps}
          />
        )}
        {canMintTestTokens && (
          <ButtonWithTextAndIcon
            icon={"plus"}
            title="Mint tokens"
            onPress={onActionMintTokens}
            additionalStyles={styles.button}
            disabled={activeWallet?.isViewOnlyWallet}
          />
        )}
      </>
    );
  };

  return (
    <View style={styles.buttonsWrapper}>
      {hasWallet ? buttonsActiveWallet() : buttonsNoWallet()}
    </View>
  );
};

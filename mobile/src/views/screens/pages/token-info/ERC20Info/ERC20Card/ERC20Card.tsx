import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import React, { useState } from "react";
import { ImageBackground, View } from "react-native";
import { ImageCardBackground } from "@assets/img/ImagesMobile";
import { TokenStackParamList } from "@models/navigation-models";
import { CommonActions, useNavigation } from "@react-navigation/native";
import {
  ERC20AmountRecipient,
  ERC20Token,
  usePOIRequiredForCurrentNetwork,
  useReduxSelector,
  WalletCardSlideItem,
} from "@react-shared";
import { WalletCardSlideButtons } from "@screens/tabs/WalletsScreen/WalletCardSlides/WalletCardSlideButtons/WalletCardSlideButtons";
import { WalletCardSlideFooter } from "@screens/tabs/WalletsScreen/WalletCardSlides/WalletCardSlideFooter/WalletCardSlideFooter";
import { WalletCardSlideName } from "@screens/tabs/WalletsScreen/WalletCardSlides/WalletCardSlideName/WalletCardSlideName";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { PendingBalancesModal } from "@views/screens/modals/POIBalanceBucketModal/PendingBalancesModal";
import { POIPendingBalanceCallout } from "@views/screens/tabs/WalletsScreen/POIPendingBalanceCallout/POIPendingBalanceCallout";
import { ERC20CardBalance } from "./ERC20CardBalance/ERC20CardBalance";
import { styles } from "./styles";

type Props = {
  token: ERC20Token;
  tokenPrice: Optional<number>;
  isRailgun: boolean;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
  onActionCreateWallet: () => void;
  onActionImportWallet: () => void;
  onActionUnshieldERC20s: () => void;
  onActionShieldTokens: () => void;
  onActionSendERC20s: () => void;
  onActionSwapTokens: () => void;
  onActionFarmERC20s: (isRedeem: boolean) => void;
  onActionReceiveTokens: () => void;
  onActionMintTokens: () => void;
};

export const ERC20Card: React.FC<Props> = ({
  token,
  tokenPrice,
  isRailgun,
  onActionCreateWallet,
  onActionImportWallet,
  onActionUnshieldERC20s,
  onActionShieldTokens,
  onActionSendERC20s,
  onActionSwapTokens,
  onActionFarmERC20s,
  onActionReceiveTokens,
  onActionMintTokens,
  balanceBucketFilter,
}) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const navigation = useNavigation();
  const { poiRequired } = usePOIRequiredForCurrentNetwork();
  const [showPendingBalancesModal, setShowPendingBalancesModal] =
    useState(false);

  const activeWallet = wallets.active;
  const hasWallet = [...wallets.available, ...wallets.viewOnly].length > 0;

  const item: WalletCardSlideItem =
    isRailgun || (isDefined(activeWallet) && activeWallet.isViewOnlyWallet)
      ? {
          walletAddress: activeWallet?.railAddress,
          walletName: activeWallet?.name ?? "RAILGUN",
          isRailgun: true,
        }
      : {
          walletAddress: activeWallet?.ethAddress,
          walletName: activeWallet?.name ?? `${network.current.publicName}`,
          isRailgun: false,
        };

  const navigateUnshieldToOrigin = (
    originalShieldTxid: string,
    erc20AmountRecipients: ERC20AmountRecipient[]
  ) => {
    setShowPendingBalancesModal(false);
    const params: TokenStackParamList["UnshieldERC20sConfirm"] = {
      erc20AmountRecipients: erc20AmountRecipients,
      isBaseTokenUnshield: false,
      nftAmountRecipients: [],
      balanceBucketFilter: balanceBucketFilter,
      unshieldToOriginShieldTxid: originalShieldTxid,
    };
    navigation.dispatch(
      CommonActions.navigate("Token", {
        screen: "UnshieldERC20sConfirm",
        params,
      })
    );
  };

  return (
    <>
      <View style={styles.cardWrapper}>
        <ImageBackground
          source={ImageCardBackground()}
          style={styles.imageDotsBackground}
        >
          <View style={styles.backgroundOverlay} />
          <WalletCardSlideName
            slideIsActive={true}
            walletName={isRailgun ? "Private balance" : `Public balance`}
          />
          <ERC20CardBalance
            item={item}
            token={token}
            tokenPrice={tokenPrice}
            isRailgun={isRailgun}
            balanceBucketFilter={balanceBucketFilter}
          />
          {isRailgun && poiRequired && (
            <POIPendingBalanceCallout
              token={token}
              onPress={() => {
                triggerHaptic(HapticSurface.NavigationButton);
                setShowPendingBalancesModal(true);
              }}
            />
          )}
          <WalletCardSlideButtons
            hasWallet={hasWallet}
            item={item}
            token={token}
            onActionCreateWallet={onActionCreateWallet}
            onActionImportWallet={onActionImportWallet}
            onActionUnshieldERC20s={onActionUnshieldERC20s}
            onActionShieldTokens={onActionShieldTokens}
            onActionSendERC20s={onActionSendERC20s}
            onActionSwapTokens={onActionSwapTokens}
            onActionFarmERC20s={onActionFarmERC20s}
            onActionReceiveTokens={onActionReceiveTokens}
            onActionMintTokens={onActionMintTokens}
          />
          <WalletCardSlideFooter
            item={item}
            onActionShieldTokens={onActionShieldTokens}
            onActionUnshieldERC20s={onActionUnshieldERC20s}
          />
        </ImageBackground>
      </View>
      {poiRequired && (
        <PendingBalancesModal
          show={showPendingBalancesModal}
          onDismiss={() => {
            setShowPendingBalancesModal(false);
          }}
          navigateUnshieldToOrigin={navigateUnshieldToOrigin}
        />
      )}
    </>
  );
};

import { RailgunWalletBalanceBucket } from "@railgun-community/shared-models";
import React from "react";
import { ImageBackground, View } from "react-native";
import { ImageCardBackground } from "@assets/img/ImagesMobile";
import { WalletCardSlideItem } from "@react-shared";
import { WalletCardSlideBalance } from "../WalletCardSlideBalance/WalletCardSlideBalance";
import { WalletCardSlideButtons } from "../WalletCardSlideButtons/WalletCardSlideButtons";
import { WalletCardSlideFooter } from "../WalletCardSlideFooter/WalletCardSlideFooter";
import { WalletCardSlideName } from "../WalletCardSlideName/WalletCardSlideName";
import { styles } from "./styles";

type Props = {
  hasWallet: boolean;
  item: WalletCardSlideItem;
  slideIsActive: boolean;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
  onActionCreateWallet: () => void;
  onActionImportWallet: () => void;
  onActionUnshieldERC20s: () => void;
  onActionShieldTokens: () => void;
  onActionSendERC20s: () => void;
  onActionReceiveTokens: () => void;
  onActionMintTokens: () => void;
};

export const WalletCardSlide: React.FC<Props> = ({
  hasWallet,
  item,
  slideIsActive,
  balanceBucketFilter,
  onActionCreateWallet,
  onActionImportWallet,
  onActionUnshieldERC20s,
  onActionShieldTokens,
  onActionSendERC20s,
  onActionReceiveTokens,
  onActionMintTokens,
}) => {
  return (
    <View style={styles.cardWrapper}>
      <ImageBackground
        source={ImageCardBackground()}
        style={styles.imageDotsBackground}
      >
        <View style={styles.backgroundOverlay} />
        <WalletCardSlideName
          walletAddress={item.walletAddress}
          walletName={item.walletName}
          slideIsActive={slideIsActive}
        />
        <WalletCardSlideBalance
          item={item}
          balanceBucketFilter={balanceBucketFilter}
        />
        <WalletCardSlideButtons
          hasWallet={hasWallet}
          item={item}
          onActionCreateWallet={onActionCreateWallet}
          onActionImportWallet={onActionImportWallet}
          onActionUnshieldERC20s={onActionUnshieldERC20s}
          onActionShieldTokens={onActionShieldTokens}
          onActionSendERC20s={onActionSendERC20s}
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
  );
};

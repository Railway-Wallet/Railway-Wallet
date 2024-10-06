import React from "react";
import { Dimensions, View } from "react-native";
import { useReduxSelector, WalletCardSlideItem } from "@react-shared";

const CarouselStable = require("react-native-snap-carousel-stable").default;
const CarouselBeta = require("react-native-snap-carousel-beta").default;

import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import { isAndroid } from "@services/util/platform-os-service";
import { WalletCardSlide } from "./WalletCardSlide/WalletCardSlide";
import { styles } from "./styles";

const HORIZONTAL_SLIDE_MARGIN = 0;
const SLIDER_WIDTH = Dimensions.get("window").width;
const ITEM_WIDTH = SLIDER_WIDTH + HORIZONTAL_SLIDE_MARGIN * 2 - 69;

type Props = {
  isRailgun: boolean;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
  onActionCreateWallet: () => void;
  onActionImportWallet: () => void;
  onActionUnshieldERC20s: () => void;
  onActionShieldTokens: () => void;
  onActionSendERC20s: () => void;
  onActionReceiveTokens: () => void;
  onActionMintTokens: () => void;
  onWalletBecameActive: (isRailgun: boolean) => void;
};

export const WalletCardSlides: React.FC<Props> = ({
  isRailgun,
  balanceBucketFilter,
  onActionCreateWallet,
  onActionImportWallet,
  onActionUnshieldERC20s,
  onActionShieldTokens,
  onActionSendERC20s,
  onActionReceiveTokens,
  onActionMintTokens,
  onWalletBecameActive,
}) => {
  const { wallets } = useReduxSelector("wallets");

  const activeWallet = wallets.active;

  const slideItems: WalletCardSlideItem[] = [
    {
      walletAddress: activeWallet?.railAddress,
      walletName: activeWallet?.name ?? "PRIVATE",
      isRailgun: true,
    },
  ];

  if (!wallets.active || !wallets.active.isViewOnlyWallet) {
    slideItems.push({
      walletAddress:
        isDefined(activeWallet) && !activeWallet.isViewOnlyWallet
          ? activeWallet.ethAddress
          : undefined,
      walletName: activeWallet?.name ?? "PUBLIC",
      isRailgun: false,
    });
  }

  const onSlideBecameActive = (slideIndex: number) => {
    const slideItem = slideItems[slideIndex];
    return onWalletBecameActive(slideItem.isRailgun);
  };

  const walletCardSlide = (item: WalletCardSlideItem) => {
    return (
      <WalletCardSlide
        hasWallet={isDefined(wallets.active)}
        item={item}
        slideIsActive={item.isRailgun === isRailgun}
        onActionCreateWallet={onActionCreateWallet}
        onActionImportWallet={onActionImportWallet}
        onActionUnshieldERC20s={onActionUnshieldERC20s}
        onActionShieldTokens={onActionShieldTokens}
        onActionSendERC20s={onActionSendERC20s}
        onActionReceiveTokens={onActionReceiveTokens}
        onActionMintTokens={onActionMintTokens}
        balanceBucketFilter={balanceBucketFilter}
      />
    );
  };

  return (
    <View style={styles.cardsWrapper}>
      {}
      {isAndroid() ? (
        <CarouselBeta
          data={slideItems}
          renderItem={(slide: { item: WalletCardSlideItem }) =>
            walletCardSlide(slide.item)
          }
          sliderWidth={SLIDER_WIDTH}
          itemWidth={ITEM_WIDTH}
          onSnapToItem={onSlideBecameActive}
          enableSnap={true}
          vertical={false}
        />
      ) : (
        <CarouselStable
          data={slideItems}
          renderItem={(slide: { item: WalletCardSlideItem }) =>
            walletCardSlide(slide.item)
          }
          sliderWidth={SLIDER_WIDTH}
          itemWidth={ITEM_WIDTH}
          onSnapToItem={onSlideBecameActive}
          enableSnap={true}
          activeAnimationType="spring"
        />
      )}
    </View>
  );
};

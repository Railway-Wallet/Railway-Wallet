import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import React from "react";
import { ResizingCardBalance } from "@components/text/ResizingCardBalance/ResizingCardBalance";
import { useTotalBalanceCurrency, WalletCardSlideItem } from "@react-shared";

type Props = {
  item: WalletCardSlideItem;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
};

export const WalletCardSlideBalance: React.FC<Props> = ({
  item,
  balanceBucketFilter,
}) => {
  const { totalBalanceCurrency } = useTotalBalanceCurrency(
    item.isRailgun,
    balanceBucketFilter
  );

  return (
    <ResizingCardBalance
      hasWallet={isDefined(item.walletAddress)}
      totalBalanceCurrency={totalBalanceCurrency}
    />
  );
};

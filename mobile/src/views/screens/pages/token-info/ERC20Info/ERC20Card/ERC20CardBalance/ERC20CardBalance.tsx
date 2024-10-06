import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import React from "react";
import { Image, Text, View } from "react-native";
import { ResizingCardBalance } from "@components/text/ResizingCardBalance/ResizingCardBalance";
import {
  AppSettingsService,
  ERC20Token,
  formatNumberToLocaleWithMinDecimals,
  getTokenDisplayNameShort,
  imageForToken,
  useERC20DecimalBalances,
  useReduxSelector,
  WalletCardSlideItem,
} from "@react-shared";
import { styles } from "./styles";

type Props = {
  item: WalletCardSlideItem;
  isRailgun: boolean;
  token: ERC20Token;
  tokenPrice: Optional<number>;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
};

export const ERC20CardBalance: React.FC<Props> = ({
  item,
  token,
  tokenPrice,
  isRailgun,
  balanceBucketFilter,
}) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { discreetMode } = useReduxSelector("discreetMode");

  const { erc20Balance, erc20BalanceCurrency } = useERC20DecimalBalances(
    token,
    isRailgun,
    balanceBucketFilter
  );

  const appCurrency = AppSettingsService.currency;
  const icon = imageForToken(token);

  return (
    <View style={styles.wrapper}>
      <ResizingCardBalance
        hasWallet={isDefined(item.walletAddress)}
        totalBalanceCurrency={erc20BalanceCurrency}
      />
      <View style={styles.balanceWrapper}>
        <Image source={icon} style={styles.tokenIcon} />
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.balanceText}>
          {discreetMode.enabled
            ? "***"
            : formatNumberToLocaleWithMinDecimals(erc20Balance, 20)}{" "}
          {getTokenDisplayNameShort(
            token,
            wallets.available,
            network.current.name
          )}
        </Text>
      </View>
      {isDefined(tokenPrice) ? (
        <View style={styles.priceWrapper}>
          <Text style={styles.priceText}>
            {tokenPrice
              ? `${appCurrency.symbol}${formatNumberToLocaleWithMinDecimals(
                  tokenPrice,
                  6
                )} per token`
              : undefined}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

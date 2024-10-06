import { ZeroXConfig, ZeroXQuote } from "@railgun-community/cookbook";
import React from "react";
import {
  ERC20Amount,
  usePublicSwapQuote,
  useReduxSelector,
} from "@react-shared";
import { SharedSwapContent, SwapContentProps } from "./SharedSwapContent";

export const ZeroXPublicSwapContent: React.FC<SwapContentProps> = ({
  navigation,
  swapSettings,
  sellERC20Amount,
  buyERC20,
  returnBackFromCompletedOrder,
  ...props
}: SwapContentProps) => {
  const { remoteConfig } = useReduxSelector("remoteConfig");

  ZeroXConfig.PROXY_API_DOMAIN = remoteConfig.current?.proxyApiUrl;
  const { quote, quoteError, isLoadingQuote } = usePublicSwapQuote(
    sellERC20Amount,
    buyERC20,
    swapSettings.slippagePercentage,
    ZeroXQuote.getSwapQuote
  );

  const buyERC20Amount: Optional<ERC20Amount> =
    quote && buyERC20
      ? {
          token: buyERC20,
          amountString: quote.buyERC20Amount.amount.toString(),
        }
      : undefined;

  const goToReviewOrder = () => {
    if (!sellERC20Amount || !buyERC20 || !quote) {
      return;
    }
    navigation.navigate("SwapPublicConfirm", {
      returnBackFromCompletedOrder,
      originalQuote: quote,
      sellERC20Amount,
      buyERC20: buyERC20,
      originalSlippagePercentage: swapSettings.slippagePercentage,
    });
  };

  return (
    <SharedSwapContent
      navigation={navigation}
      isRailgun={false}
      quote={quote}
      quoteError={quoteError}
      isLoadingQuote={isLoadingQuote}
      swapSettings={swapSettings}
      sellERC20Amount={sellERC20Amount}
      buyERC20={buyERC20}
      buyERC20Amount={buyERC20Amount}
      onTapReviewOrder={goToReviewOrder}
      returnBackFromCompletedOrder={returnBackFromCompletedOrder}
      {...props}
    />
  );
};

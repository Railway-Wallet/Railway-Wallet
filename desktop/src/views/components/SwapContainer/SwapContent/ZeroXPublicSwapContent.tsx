import { ZeroXConfig, ZeroXV2Quote } from '@railgun-community/cookbook';
import {
  ERC20Amount,
  usePublicSwapQuote,
  useReduxSelector,
} from '@react-shared';
import {
  DrawerName,
  EVENT_OPEN_DRAWER_WITH_DATA,
  SwapPublicData,
} from '../../../../models/drawer-types';
import { drawerEventsBus } from '../../../../services/navigation/drawer-events';
import { SharedSwapContent, SwapContentProps } from './SharedSwapContent';

export const ZeroXPublicSwapContent: React.FC<SwapContentProps> = ({
  slippagePercentage,
  sellERC20Amount,
  buyERC20,
  ...props
}: SwapContentProps) => {
  const { remoteConfig } = useReduxSelector('remoteConfig');

  ZeroXConfig.PROXY_API_DOMAIN = remoteConfig.current?.proxyApiUrl;
  const { quote, quoteError, isLoadingQuote } = usePublicSwapQuote(
    sellERC20Amount,
    buyERC20,
    slippagePercentage,
    ZeroXV2Quote.getSwapQuote,
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
    const extraData: SwapPublicData = {
      sellERC20Amount,
      buyERC20: buyERC20,
      originalSlippagePercentage: slippagePercentage,
      originalQuote: quote,
    };
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.SwapPublic,
      extraData,
    });
  };

  return (
    <SharedSwapContent
      isRailgun={false}
      quote={quote}
      quoteError={quoteError}
      isLoadingQuote={isLoadingQuote}
      slippagePercentage={slippagePercentage}
      sellERC20Amount={sellERC20Amount}
      buyERC20={buyERC20}
      buyERC20Amount={buyERC20Amount}
      onTapReviewOrder={goToReviewOrder}
      {...props}
    />
  );
};

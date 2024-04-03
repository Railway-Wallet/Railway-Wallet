import { SwapQuoteData } from '@railgun-community/cookbook';
import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import { AlertProps } from '@components/alerts/GenericAlert/GenericAlert';
import { Button } from '@components/Button/Button';
import { Text } from '@components/Text/Text';
import {
  compareTokens,
  ERC20Amount,
  ERC20Token,
  isRebaseToken,
  useReduxSelector,
} from '@react-shared';
import { SwapSettings } from '@screens/modals/SwapSettingsModal/SwapSettingsModal';
import { IconType } from '@services/util/icon-service';
import { ErrorDetailsModal } from '@views/screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import { SwapBuyTokenAmount } from './SwapBuyTokenAmount/SwapBuyTokenAmount';
import { SwapSellTokenAmount } from './SwapSellTokenAmount/SwapSellTokenAmount';
import styles from './SwapContent.module.scss';

export type SwapContentProps = {
  setAlert: (alert: Optional<AlertProps>) => void;
  sellERC20: Optional<ERC20Token>;
  sellERC20Amount: Optional<ERC20Amount>;
  swapSettings: SwapSettings;
  buyERC20: Optional<ERC20Token>;
  sellTokenEntryString: string;
  setCurrentSellERC20: (token: Optional<ERC20Token>) => void;
  setCurrentBuyERC20: (token: Optional<ERC20Token>) => void;
  setSellTokenEntryString: (value: string) => void;
};

type Props = SwapContentProps & {
  isRailgun: boolean;
  quote: Optional<SwapQuoteData>;
  quoteError: Optional<Error>;
  buyERC20Amount: Optional<ERC20Amount>;
  isLoadingQuote: boolean;
  onTapReviewOrder: () => void;
};

export const SharedSwapContent: React.FC<Props> = ({
  isRailgun,
  quote,
  quoteError,
  isLoadingQuote,
  sellERC20,
  buyERC20,
  buyERC20Amount,
  sellTokenEntryString,
  setCurrentSellERC20,
  setCurrentBuyERC20,
  setSellTokenEntryString,
  onTapReviewOrder,
}: Props) => {
  const { network } = useReduxSelector('network');

  const [hasValidSellAmount, setHasValidSellAmount] = useState(false);
  const [errorDetailsOpen, setErrorDetailsOpen] = useState(false);

  const switchBuyAndSell = () => {
    const tempSellToken = sellERC20;
    setCurrentSellERC20(buyERC20);
    setCurrentBuyERC20(tempSellToken);
  };

  const updateSellERC20 = (token: ERC20Token) => {
    const originalSellToken = sellERC20;
    setCurrentSellERC20(token);
    if (originalSellToken && compareTokens(token, buyERC20)) {
      setCurrentBuyERC20(originalSellToken);
    }
  };

  const updateBuyERC20 = (token: ERC20Token) => {
    const originalBuyToken = buyERC20;
    setCurrentBuyERC20(token);
    if (originalBuyToken && compareTokens(token, sellERC20)) {
      setCurrentSellERC20(originalBuyToken);
    }
  };

  const showErrorDetails = () => {
    setErrorDetailsOpen(true);
  };
  const hideErrorDetails = () => {
    setErrorDetailsOpen(false);
  };

  const hasRebaseToken = (): boolean => {
    return (
      (sellERC20 ? isRebaseToken(sellERC20?.address) : false) ||
      (buyERC20 ? isRebaseToken(buyERC20?.address) : false)
    );
  };

  const baseTokenError =
    isRailgun &&
    ((sellERC20?.isBaseToken ?? false) || (buyERC20?.isBaseToken ?? false))
      ? new Error(
          `You may not swap ${network.current.baseToken.symbol} privately, as this base token cannot be shielded. Try wrapped base token ${network.current.baseToken.wrappedSymbol} instead.`,
        )
      : undefined;
  const tokenError =
    isRailgun && hasRebaseToken()
      ? new Error(
          'One of your selections is a Rebase Token, which may not be shielded.',
        )
      : undefined;

  const error: Optional<Error> =
    baseTokenError ?? quoteError ?? tokenError ?? undefined;

  return (
    <>
      <div className={styles.sectionSell}>
        <SwapSellTokenAmount
          isRailgun={isRailgun}
          sellERC20={sellERC20}
          buyERC20={buyERC20}
          quote={quote}
          setSellToken={updateSellERC20}
          sellTokenEntryString={sellTokenEntryString}
          setSellTokenEntryString={setSellTokenEntryString}
          setHasValidSellAmount={setHasValidSellAmount}
        />
      </div>
      <div className={styles.switchButtonContainer}>
        <Button
          buttonClassName={styles.switchButton}
          endIcon={IconType.SwitchVertical}
          alt="swap sell and buy"
          onClick={switchBuyAndSell}
          iconOnly
          disabled={!sellERC20 || !buyERC20}
        />
      </div>
      <div className={styles.sectionBuy}>
        <SwapBuyTokenAmount
          isRailgun={isRailgun}
          sellERC20={sellERC20}
          buyERC20={buyERC20}
          buyERC20Amount={buyERC20Amount}
          setCurrentBuyERC20={updateBuyERC20}
          quote={quote}
          isLoadingQuote={isLoadingQuote}
        />
        <Button
          buttonClassName={styles.nextButton}
          disabled={
            !isDefined(quote) || !hasValidSellAmount || isDefined(error)
          }
          textClassName={styles.nextButtonText}
          onClick={onTapReviewOrder}
        >
          Review order
        </Button>
        {isDefined(error) && (
          <Text className={styles.errorText}>
            {error.message}{' '}
            <Text className={styles.errorShowMore} onClick={showErrorDetails}>
              (show more)
            </Text>
          </Text>
        )}
      </div>
      {errorDetailsOpen && isDefined(error) && (
        <ErrorDetailsModal error={error} onDismiss={hideErrorDetails} />
      )}
    </>
  );
};

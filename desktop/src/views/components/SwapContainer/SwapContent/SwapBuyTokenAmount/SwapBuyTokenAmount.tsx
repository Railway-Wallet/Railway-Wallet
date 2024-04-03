import { SwapQuoteData } from '@railgun-community/cookbook';
import {
  isDefined,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { useMemo, useState } from 'react';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { Text } from '@components/Text/Text';
import { TextButton } from '@components/TextButton/TextButton';
import {
  ERC20Amount,
  ERC20Token,
  getDecimalBalanceString,
  getTokenDisplayName,
  imageForToken,
  SelectTokenPurpose,
  TransactionType,
  useReduxSelector,
  useRelayAdaptPrivateNotice,
} from '@react-shared';
import { SelectERC20Modal } from '@screens/modals/SelectTokenModal/SelectERC20Modal';
import { parseTokenIcon } from '@utils/images';
import styles from './SwapBuyTokenAmount.module.scss';

const ZERO_X_PRICE_DECIMALS = 18;

type Props = {
  isRailgun: boolean;
  sellERC20: Optional<ERC20Token>;
  buyERC20: Optional<ERC20Token>;
  buyERC20Amount: Optional<ERC20Amount>;
  setCurrentBuyERC20: (token: ERC20Token) => void;
  quote?: SwapQuoteData;
  isLoadingQuote: boolean;
};

export const SwapBuyTokenAmount: React.FC<Props> = ({
  isRailgun,
  sellERC20,
  buyERC20,
  setCurrentBuyERC20,
  buyERC20Amount,
  quote,
  isLoadingQuote,
}: Props) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const [showSelectERC20Modal, setShowSelectERC20Modal] = useState(false);
  const [
    reverseOrderSellBuyConversionText,
    setReverseOrderSellBuyConversionText,
  ] = useState(false);

  const { notice: privateDisclaimerText } = useRelayAdaptPrivateNotice(
    isRailgun,
    'swap',
    '0x Exchange',
    'Railway DEX swaps are atomic and non-custodial.',
  );

  const onDismissSelectERC20Modal = (token?: ERC20Token) => {
    if (token) {
      setCurrentBuyERC20(token);
    }
    setShowSelectERC20Modal(false);
  };

  const onTapTokenSelector = () => {
    setShowSelectERC20Modal(true);
  };

  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];

  const buyERC20AmountText =
    !isLoadingQuote && buyERC20Amount
      ? getDecimalBalanceString(
          BigInt(buyERC20Amount.amountString),
          buyERC20Amount.token.decimals,
        )
      : undefined;

  const sellBuyConversionText = useMemo(() => {
    if (!sellERC20 || !buyERC20 || !quote) {
      return;
    }

    if (reverseOrderSellBuyConversionText) {
      const quotePriceText = getDecimalBalanceString(
        (10n ** BigInt(ZERO_X_PRICE_DECIMALS) * 2n) / quote.price,
        ZERO_X_PRICE_DECIMALS,
      );
      return `1 ${getTokenDisplayName(
        buyERC20,
        wallets.available,
        network.current.name,
      )} = ${quotePriceText}
            ${getTokenDisplayName(
              sellERC20,
              wallets.available,
              network.current.name,
            )}`;
    }

    const quotePriceText = getDecimalBalanceString(
      quote.price,
      ZERO_X_PRICE_DECIMALS,
    );
    return `1 ${getTokenDisplayName(
      sellERC20,
      wallets.available,
      network.current.name,
    )} = ${quotePriceText}
            ${getTokenDisplayName(
              buyERC20,
              wallets.available,
              network.current.name,
            )}`;
  }, [
    sellERC20,
    buyERC20,
    quote,
    reverseOrderSellBuyConversionText,
    wallets.available,
    network,
  ]);

  return (
    <>
      {showSelectERC20Modal && (
        <SelectERC20Modal
          headerTitle="Select token to buy"
          skipBaseToken={false}
          onDismiss={onDismissSelectERC20Modal}
          isRailgun={isRailgun}
          balanceBucketFilter={balanceBucketFilter}
          purpose={SelectTokenPurpose.Transfer}
          transactionType={TransactionType.Swap}
          hasExistingTokenAmounts={false}
          showAddTokensButton={true}
          useRelayAdaptForRelayerFee={false}
        />
      )}
      <div className={styles.sectionHeader}>
        <Text className={styles.sectionHeaderTitle}>You receive:</Text>
        {isDefined(sellBuyConversionText) && (
          <TextButton
            textClassName={styles.sectionHeaderRightText}
            text={sellBuyConversionText}
            action={() => {
              setReverseOrderSellBuyConversionText(
                !reverseOrderSellBuyConversionText,
              );
            }}
          />
        )}
      </div>
      <div className={styles.amountInputContainer}>
        <Input
          onChange={() => {}}
          placeholder={isLoadingQuote ? 'Getting best price...' : '0'}
          value={buyERC20AmountText ?? ''}
          disabled={true}
        />
        <Button
          children={
            buyERC20
              ? getTokenDisplayName(
                  buyERC20,
                  wallets.available,
                  network.current.name,
                )
              : 'N/A'
          }
          onClick={onTapTokenSelector}
          textClassName={styles.bottomButtonLabel}
          buttonClassName={styles.selectTokenButton}
          endIcon={
            buyERC20 ? parseTokenIcon(imageForToken(buyERC20)) : undefined
          }
        />
      </div>
      {isRailgun && (
        <div className={styles.feeDisclaimerContainer}>
          <Text className={styles.feeDisclaimer}>{privateDisclaimerText}</Text>
        </div>
      )}
    </>
  );
};

import { SwapQuoteData } from '@railgun-community/cookbook';
import {
  isDefined,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { useEffect, useRef, useState } from 'react';
import { ApproveButton } from '@components/ApproveButton/ApproveButton';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { Text } from '@components/Text/Text';
import {
  ApproveSpenderData,
  DrawerName,
  EVENT_OPEN_DRAWER_WITH_DATA,
} from '@models/drawer-types';
import {
  compareTokens,
  ERC20Token,
  formatUnitFromHexString,
  getDecimalBalanceString,
  getTokenDisplayName,
  imageForToken,
  isWrappedBaseTokenForNetwork,
  maxBigIntForTransaction,
  SelectTokenPurpose,
  stringEntryToBigInt,
  TransactionType,
  useERC20Allowance,
  useERC20Balance,
  useReduxSelector,
  useValidateNumEntry,
} from '@react-shared';
import { SelectERC20Modal } from '@screens/modals/SelectTokenModal/SelectERC20Modal';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { parseTokenIcon } from '@utils/images';
import buyStyles from '../SwapBuyTokenAmount/SwapBuyTokenAmount.module.scss';
import styles from './SwapSellTokenAmount.module.scss';

type Props = {
  isRailgun: boolean;
  sellERC20: Optional<ERC20Token>;
  buyERC20: Optional<ERC20Token>;
  setSellToken: (token: ERC20Token) => void;
  sellTokenEntryString: string;
  setSellTokenEntryString: (entryString: string) => void;
  quote?: SwapQuoteData;
  setHasValidSellAmount: (isValid: boolean) => void;
};

export const SwapSellTokenAmount: React.FC<Props> = ({
  isRailgun,
  sellERC20,
  buyERC20,
  setSellToken,
  sellTokenEntryString,
  setSellTokenEntryString,
  quote,
  setHasValidSellAmount,
}: Props) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const activeWallet = wallets.active;

  const [showSelectERC20Modal, setShowSelectERC20Modal] = useState(false);
  const [sellTokenError, setSellTokenError] = useState<Optional<Error>>();

  const currentSellToken = useRef<Optional<ERC20Token>>(undefined);

  const onDismissSelectERC20Modal = (token?: ERC20Token) => {
    if (token && !compareTokens(token, sellERC20)) {
      setSellToken(token);
      resetERC20Allowance();
    }
    setShowSelectERC20Modal(false);
  };

  const transactionType = TransactionType.Swap;
  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];
  const { tokenBalance } = useERC20Balance(
    activeWallet,
    sellERC20,
    isRailgun,
    balanceBucketFilter,
  );

  useEffect(() => {
    currentSellToken.current = sellERC20;
  }, [sellERC20]);

  const {
    erc20Allowance,
    pendingApproveERC20Transaction,
    resetERC20Allowance,
    requiresApproval,
  } = useERC20Allowance(
    sellERC20,
    transactionType,
    quote?.spender,
    isRailgun,
    setSellTokenError,
  );

  const showTokenApprove =
    requiresApproval &&
    isDefined(erc20Allowance) &&
    isDefined(currentSellToken.current) &&
    (erc20Allowance === 0n ||
      erc20Allowance <
        stringEntryToBigInt(
          sellTokenEntryString,
          currentSellToken.current.decimals,
        ));

  const balanceText = sellERC20
    ? `${isRailgun ? 'Private' : 'Public'} balance: ${
        isDefined(tokenBalance)
          ? getDecimalBalanceString(tokenBalance, sellERC20.decimals)
          : 'Loading...'
      }`
    : 'Select a token';

  const { hasValidNumEntry, disableNumPad } = useValidateNumEntry(
    setSellTokenError,
    sellTokenEntryString,
    erc20Allowance,
    requiresApproval,
    tokenBalance ?? 0n,
    transactionType,
    sellERC20,
    isRailgun,
  );

  useEffect(() => {
    const isBaseTokenUnwrap =
      isDefined(sellERC20) &&
      isWrappedBaseTokenForNetwork(sellERC20, network.current) &&
      isDefined(buyERC20) &&
      (buyERC20.isBaseToken ?? false);

    const hasValidApproval =
      isBaseTokenUnwrap ||
      (!(requiresApproval && !isDefined(erc20Allowance)) && !showTokenApprove);
    setHasValidSellAmount(hasValidNumEntry && hasValidApproval);
  }, [
    sellERC20,
    network,
    buyERC20,
    hasValidNumEntry,
    requiresApproval,
    setHasValidSellAmount,
    showTokenApprove,
    erc20Allowance,
  ]);

  const onTapTokenSelector = () => {
    setShowSelectERC20Modal(true);
  };

  const openApprove = () => {
    if (!sellERC20 || !quote || !isDefined(quote.spender)) {
      return;
    }
    const extraData: ApproveSpenderData = {
      erc20Amount: {
        token: sellERC20,
        amountString: maxBigIntForTransaction().toString(),
      },
      spender: quote.spender,
      spenderName: '0x Exchange',
      infoCalloutText: 'Approving token to swap via 0x exchange.',
    };
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.ApproveSpender,
      extraData,
    });
  };

  const onTapMaxButton = () => {
    if (disableNumPad) {
      return;
    }
    if (!sellERC20) {
      return;
    }
    const newString = formatUnitFromHexString(
      tokenBalance ?? 0n,
      sellERC20.decimals,
    );
    setSellTokenEntryString(newString);
  };

  return (
    <>
      {showSelectERC20Modal && (
        <SelectERC20Modal
          headerTitle="Select token to sell"
          skipBaseToken={isRailgun}
          onDismiss={onDismissSelectERC20Modal}
          isRailgun={isRailgun}
          balanceBucketFilter={balanceBucketFilter}
          purpose={SelectTokenPurpose.Transfer}
          transactionType={transactionType}
          hasExistingTokenAmounts={false}
          showAddTokensButton={true}
          useRelayAdaptForBroadcasterFee={false}
        />
      )}
      <div className={buyStyles.sectionHeader}>
        <Text className={buyStyles.sectionHeaderTitle}>You pay:</Text>
        <Text className={buyStyles.sectionHeaderRightText}>{balanceText}</Text>
      </div>
      <div className={buyStyles.amountInputContainer}>
        <Input
          onChange={e => setSellTokenEntryString(e.target.value)}
          placeholder="0"
          type="number"
          value={sellTokenEntryString}
          hasError={sellTokenEntryString.length > 0 && !hasValidNumEntry}
          rightView={
            <Button
              children="MAX"
              onClick={onTapMaxButton}
              textClassName={buyStyles.bottomButtonLabel}
              buttonClassName={buyStyles.inputInsetButton}
            />
          }
        />
        <Button
          children={
            sellERC20
              ? getTokenDisplayName(
                  sellERC20,
                  wallets.available,
                  network.current.name,
                )
              : 'N/A'
          }
          onClick={onTapTokenSelector}
          textClassName={buyStyles.bottomButtonLabel}
          buttonClassName={buyStyles.selectTokenButton}
          endIcon={
            sellERC20 ? parseTokenIcon(imageForToken(sellERC20)) : undefined
          }
        />
      </div>
      {isDefined(sellTokenError) && (
        <Text className={styles.errorText}>{sellTokenError.message}</Text>
      )}
      {showTokenApprove &&
        currentSellToken.current === sellERC20 &&
        sellERC20 && (
          <ApproveButton
            pendingApproveTransaction={pendingApproveERC20Transaction}
            buttonClassName={styles.nextButton}
            textClassName={buyStyles.bottomButtonLabel}
            approve={openApprove}
            approveText={`Approve ${getTokenDisplayName(
              sellERC20,
              wallets.available,
              network.current.name,
            )} for 0x Exchange`}
          />
        )}
    </>
  );
};

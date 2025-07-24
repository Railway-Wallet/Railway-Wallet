import { LiquidityV2Pool, SwapQuoteData } from '@railgun-community/cookbook';
import {
  isDefined,
  NFTAmount,
  NFTAmountRecipient,
} from '@railgun-community/shared-models';
import React, { useState } from 'react';
import cn from 'classnames';
import { TransactionResponse } from 'ethers';
import { TokenIcon } from '@components/Image/TokenIcon';
import { Text } from '@components/Text/Text';
import { TextButton } from '@components/TextButton/TextButton';
import {
  AdjustedERC20AmountRecipients,
  createERC20AmountRecipientGroups,
  ERC20Amount,
  ERC20AmountRecipient,
  ERC20Token,
  formatNumberToLocaleWithMinDecimals,
  formatUnitFromHexStringToLocale,
  FrontendWallet,
  getBaseTokenForNetwork,
  getDecimalBalanceString,
  getPairExchangeRateDisplayText,
  getTokenDisplayName,
  getVaultExchangeRateDisplayText,
  getWrappedTokenForNetwork,
  hasOnlyBaseToken,
  isRailgunAddress,
  logDevError,
  RecipeFinalERC20Amounts,
  shortenWalletAddress,
  TransactionType,
  useReduxSelector,
  useWalletNameMap,
  Vault,
} from '@react-shared';
import { SelectWalletModal } from '@screens/modals/SelectWalletModal/SelectWalletModal';
import { IconType, renderIcon } from '@services/util/icon-service';
import { SlippageSelectorModal } from '@views/screens/modals/SlippageSelectorModal/SlippageSelectorModal';
import { ReviewNFTAmount } from './ReviewNFTAmount/ReviewNFTAmount';
import styles from './ReviewTransactionReviewSection.module.scss';

type Props = {
  transactionType: TransactionType;
  fromWalletAddress: string;
  adjustedERC20AmountRecipients: AdjustedERC20AmountRecipients[];
  nftAmountRecipients: NFTAmountRecipient[];
  hideTokenAmounts: Optional<boolean>;
  isShieldedFromAddress: boolean;
  isShieldedToAddress: boolean;
  isFullyPrivateTransaction: boolean;
  cancelTxResponse: Optional<TransactionResponse>;
  swapQuote: Optional<SwapQuoteData>;
  swapBuyTokenAmount: Optional<ERC20Amount>;
  swapQuoteOutdated: Optional<boolean>;
  swapDestinationAddress: Optional<string>;
  setSwapDestinationAddress: Optional<
    (destinationAddress: Optional<string>) => void
  >;
  updateSwapQuote: Optional<() => void>;
  isBaseTokenUnshield: Optional<boolean>;
  recipeFinalERC20Amounts: Optional<RecipeFinalERC20Amounts>;
  vault: Optional<Vault>;
  pool: Optional<LiquidityV2Pool>;
  setSlippagePercent?: (slippage: number) => void;
  slippagePercent?: number;
  receivedMinimumAmounts: Optional<ERC20Amount[]>;
};

export const ReviewTransactionReviewSection: React.FC<Props> = ({
  transactionType,
  fromWalletAddress,
  adjustedERC20AmountRecipients,
  recipeFinalERC20Amounts,
  nftAmountRecipients,
  hideTokenAmounts = false,
  isShieldedFromAddress,
  isShieldedToAddress,
  isFullyPrivateTransaction,
  cancelTxResponse,
  swapQuote,
  swapBuyTokenAmount,
  swapQuoteOutdated = false,
  swapDestinationAddress,
  setSwapDestinationAddress,
  setSlippagePercent,
  slippagePercent,
  updateSwapQuote,
  receivedMinimumAmounts,
  isBaseTokenUnshield = false,
  vault,
  pool,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const [showSelectSwapDestinationModal, setShowSelectSwapDestinationModal] =
    useState(false);
  const [showLiquiditySettingsModal, setShowLiquiditySettingsModal] =
    useState(false);
  const [showSwapSettingsModal, setShowSwapSettingsModal] = useState(false);

  const expectedVaultApy = vault
    ? formatNumberToLocaleWithMinDecimals(vault.apy * 100, 2)
    : 0;
  const isFarmFeature =
    transactionType === TransactionType.FarmDeposit ||
    transactionType === TransactionType.FarmRedeem;
  const isSwap = transactionType === TransactionType.Swap;
  const isLiquidity =
    transactionType === TransactionType.AddLiquidity ||
    transactionType === TransactionType.RemoveLiquidity;

  const showOutputAddress = !isDefined(recipeFinalERC20Amounts);

  const inputERC20AmountRecipients: ERC20AmountRecipient[] =
    recipeFinalERC20Amounts
      ? recipeFinalERC20Amounts.inputERC20AmountRecipients
      : adjustedERC20AmountRecipients.map(adjustedERC20AmountRecipient => {
          return adjustedERC20AmountRecipient.input;
        });

  const outputERC20AmountRecipients: ERC20AmountRecipient[] =
    recipeFinalERC20Amounts
      ? recipeFinalERC20Amounts.outputERC20AmountRecipients
      : adjustedERC20AmountRecipients.map(adjustedERC20AmountRecipient => {
          return adjustedERC20AmountRecipient.output;
        });
  const outputTokenRecipientGroups = createERC20AmountRecipientGroups(
    outputERC20AmountRecipients,
  );

  const { walletNameMap, getWalletName } = useWalletNameMap(
    outputTokenRecipientGroups,
    transactionType,
    isFullyPrivateTransaction,
  );

  const isBaseTokenShield =
    transactionType === TransactionType.Shield &&
    hasOnlyBaseToken(inputERC20AmountRecipients);

  const getDestinationToken = (token: ERC20Token): Optional<ERC20Token> => {
    if (isBaseTokenShield) {
      return getWrappedTokenForNetwork(wallets.active, network.current);
    } else if (isBaseTokenUnshield) {
      return getBaseTokenForNetwork(wallets.active, network.current);
    }
    return token;
  };

  const reviewTokenAmount = (
    tokenAmount: ERC20Amount,
    index: number,
    feeTokenAmount?: ERC20Amount,
    isDestinationToken = false,
  ) => {
    const shouldShowFee =
      isDefined(feeTokenAmount) &&
      BigInt(feeTokenAmount.amountString) !== 0n &&
      [TransactionType.Shield, TransactionType.Unshield].includes(
        transactionType,
      );

    const token = isDestinationToken
      ? getDestinationToken(tokenAmount.token)
      : tokenAmount.token;
    if (!token) {
      return null;
    }

    const displayTokenName = getTokenDisplayName(
      token,
      wallets.available,
      network.current.name,
    );

    return (
      <div key={index}>
        <div
          className={
            shouldShowFee
              ? styles.reviewTokenContainerWithFee
              : styles.reviewTokenContainer
          }
        >
          <TokenIcon token={token} className={styles.tokenIcon} />
          <Text className={styles.tokenText}>
            {!hideTokenAmounts && (
              <span className={styles.tokenAmount}>
                {formatUnitFromHexStringToLocale(
                  tokenAmount.amountString,
                  token.decimals,
                )}{' '}
              </span>
            )}
            <span
              className={cn(styles.tokenSymbol, {
                [styles.tokenSymbolSmall]: displayTokenName.length > 16,
              })}
            >
              {displayTokenName}
            </span>
          </Text>
        </div>
        {shouldShowFee &&
          isDefined(feeTokenAmount) &&
          includedFeeAmount(feeTokenAmount)}
      </div>
    );
  };

  const reviewNFTAmount = (nftAmount: NFTAmount, index: number) => {
    return (
      <div key={index}>
        <ReviewNFTAmount nftAmount={nftAmount} />
      </div>
    );
  };

  const includedFeeAmount = (tokenAmount: ERC20Amount) => {
    const token = tokenAmount.token;
    return (
      <div className={styles.includedFeeRow}>
        <Text className={styles.includedFeeText}>
          {!hideTokenAmounts && (
            <span className={styles.includedFeeTokenAmount}>
              Fee:{' '}
              {formatUnitFromHexStringToLocale(
                tokenAmount.amountString,
                token.decimals,
              )}{' '}
              {getTokenDisplayName(
                token,
                wallets.available,
                network.current.name,
              )}
            </span>
          )}
        </Text>
      </div>
    );
  };

  const dismissSelectSwapDestinationModal = (
    _wallet?: FrontendWallet,
    destinationAddress?: string,
    removeSelectedWallet?: boolean,
  ) => {
    if (!isDefined(setSwapDestinationAddress)) {
      return;
    }
    if (removeSelectedWallet === true) {
      setSwapDestinationAddress(undefined);
    }
    if (isDefined(destinationAddress)) {
      setSwapDestinationAddress(destinationAddress);
    }
    setShowSelectSwapDestinationModal(false);
  };

  const promptSwapDestinationAddress = () => {
    if (!isDefined(setSwapDestinationAddress)) {
      return;
    }
    setShowSelectSwapDestinationModal(true);
  };

  const modifySwapDestinationAddress = () => {
    if (!isDefined(setSwapDestinationAddress)) {
      return null;
    }
    return (
      <div
        className={cn(
          styles.modifyContainer,
          styles.swapDestinationAddressContainer,
        )}
      >
        <TextButton
          text={`${
            isDefined(swapDestinationAddress) ? 'Update' : 'Add'
          } destination address`}
          action={promptSwapDestinationAddress}
          containerClassName={styles.modifyTextButtonContainer}
          textClassName={styles.modifyTextButton}
        />
      </div>
    );
  };

  const modifySlippagePercent = (onPress: () => void) => {
    if (!isDefined(slippagePercent) || !isDefined(setSlippagePercent)) {
      return null;
    }

    return (
      <div className={styles.modifyContainer}>
        <TextButton
          text={`Slippage: ${(slippagePercent * 100).toFixed(
            1,
          )}% (Click to update)`}
          action={onPress}
          containerClassName={styles.modifyTextButtonContainer}
          textClassName={styles.modifyTextButton}
        />
      </div>
    );
  };

  const minimumReceivedTokenAmounts = () => {
    if (!receivedMinimumAmounts) {
      return null;
    }

    return (
      <div className={styles.minimumTokenAmountsContainer}>
        <Text className={styles.minimumLabel}>Minimum received</Text>
        {receivedMinimumAmounts.map(tokenAmount => {
          const { token, amountString } = tokenAmount;

          return (
            <Text className={styles.minimumTokenAmount}>
              {!hideTokenAmounts && (
                <span className={styles.includedFeeTokenAmount}>
                  {formatUnitFromHexStringToLocale(
                    amountString,
                    token.decimals,
                  )}{' '}
                  {getTokenDisplayName(
                    token,
                    wallets.available,
                    network.current.name,
                  )}
                </span>
              )}
            </Text>
          );
        })}
      </div>
    );
  };

  const transactionIcon = (): IconType => {
    switch (transactionType) {
      case TransactionType.ApproveShield:
      case TransactionType.ApproveSpender:
        return IconType.CheckCircle;
      case TransactionType.Shield:
      case TransactionType.Unshield:
      case TransactionType.Send:
      case TransactionType.Mint:
      case TransactionType.AddLiquidity:
      case TransactionType.RemoveLiquidity:
      case TransactionType.FarmDeposit:
      case TransactionType.FarmRedeem:
        return IconType.ArrowDown;
      case TransactionType.Swap:
        return isDefined(swapDestinationAddress)
          ? IconType.ArrowDown
          : IconType.Swap;
      case TransactionType.Cancel:
        return IconType.CloseCircle;
    }
  };

  if (!wallets.active) {
    return null;
  }

  const showReceiverWallets = () => {
    switch (transactionType) {
      case TransactionType.ApproveShield:
      case TransactionType.ApproveSpender:
      case TransactionType.Swap:
      case TransactionType.Mint:
      case TransactionType.Cancel:
        return false;
      case TransactionType.Shield:
      case TransactionType.Unshield:
      case TransactionType.Send:
      case TransactionType.AddLiquidity:
      case TransactionType.RemoveLiquidity:
      case TransactionType.FarmDeposit:
      case TransactionType.FarmRedeem:
        return true;
    }
  };

  const originalGasFeesForCancelType0 = (
    cancelTxResponse: TransactionResponse,
  ) => {
    const originalGasPrice = cancelTxResponse.gasPrice;

    return (
      <>
        <Text className={styles.cancelOriginalFeeText}>Original gas fees:</Text>
        <Text
          className={cn(
            styles.cancelTransactionText,
            styles.cancelTransactionID,
          )}
        >
          Gas price:{' '}
          {originalGasPrice
            ? getDecimalBalanceString(originalGasPrice, 9)
            : 'Unknown'}{' '}
          GWEI
        </Text>
      </>
    );
  };

  const originalGasFeesForCancelType2 = (
    cancelTxResponse: TransactionResponse,
  ) => {
    const originalBaseFee = cancelTxResponse.maxFeePerGas;
    const originalPriorityFee = cancelTxResponse.maxPriorityFeePerGas;

    return (
      <>
        <Text className={styles.cancelOriginalFeeText}>Original gas fees:</Text>
        <Text
          className={cn(
            styles.cancelTransactionText,
            styles.cancelTransactionID,
          )}
        >
          Max base fee:{' '}
          {isDefined(originalBaseFee)
            ? getDecimalBalanceString(originalBaseFee, 9)
            : 'Unknown'}{' '}
          GWEI
        </Text>
        <Text
          className={cn(
            styles.cancelTransactionText,
            styles.cancelTransactionID,
          )}
        >
          Priority fee:{' '}
          {isDefined(originalPriorityFee)
            ? getDecimalBalanceString(originalPriorityFee, 9)
            : 'Unknown'}{' '}
          GWEI
        </Text>
      </>
    );
  };

  const walletIcon = (showShield: boolean) => {
    if (showShield) {
      return renderIcon(IconType.Shield, 15);
    }
    return renderIcon(IconType.Public, 15);
  };

  if (transactionType === TransactionType.Cancel) {
    if (!cancelTxResponse) {
      return null;
    }
    const gasToken = network.current.baseToken;
    if (gasToken.decimals !== 18) {
      logDevError(new Error('Gas token decimals must be 18'));
      return null;
    }

    return (
      <div className={styles.reviewSection}>
        <div className={styles.walletNameIconWrapper}>
          {walletIcon(isShieldedFromAddress)}
          <Text className={styles.walletNameText}>
            {wallets.active.name} ({shortenWalletAddress(fromWalletAddress)})
          </Text>
        </div>
        <div className={styles.tokenAmountsWrapper}>
          <Text className={styles.cancelTransactionText}>
            Cancel pending transaction:{' '}
          </Text>
          <Text
            className={cn(
              styles.cancelTransactionText,
              styles.cancelTransactionID,
            )}
          >
            {cancelTxResponse?.hash ?? 'N/A'}
          </Text>
          {/* eslint-disable-next-line eqeqeq */}
          {cancelTxResponse.type == 0 &&
            originalGasFeesForCancelType0(cancelTxResponse)}
          {cancelTxResponse.type === 2 &&
            originalGasFeesForCancelType2(cancelTxResponse)}
        </div>
      </div>
    );
  }

  const getWalletNameFromMap = (isRailgunWallet: boolean, address: string) => {
    if (walletNameMap[address]) {
      return walletNameMap[address];
    }
    return getWalletName(isRailgunWallet, address);
  };

  const outputAddress = (isRailgunWallet: boolean, address: string) => {
    const showShieldIcon = isDefined(swapDestinationAddress)
      ? false
      : isShieldedToAddress;
    return (
      <div className={styles.walletNameIconWrapper}>
        {walletIcon(showShieldIcon)}
        <Text className={styles.walletNameText}>
          {`${getWalletNameFromMap(
            isRailgunWallet,
            address,
          )} (${shortenWalletAddress(address)})`}
        </Text>
      </div>
    );
  };

  const showPrivateSwapDestination = () => {
    if (!isDefined(swapDestinationAddress)) {
      return true;
    }
    return isRailgunAddress(swapDestinationAddress);
  };

  const openLiquiditySettings = () => {
    setShowLiquiditySettingsModal(true);
  };

  const openSwapSettings = () => {
    setShowSwapSettingsModal(true);
  };

  const showLiquiditySlippageSelector =
    (transactionType === TransactionType.AddLiquidity ||
      transactionType === TransactionType.RemoveLiquidity) &&
    isDefined(slippagePercent) &&
    isDefined(setSlippagePercent);

  const showSwapSlippageSelector =
    isSwap && isDefined(slippagePercent) && isDefined(setSlippagePercent);

  return (
    <>
      {showSelectSwapDestinationModal && (
        <SelectWalletModal
          title="Select swap destination"
          isRailgunInitial={showPrivateSwapDestination()}
          onDismiss={dismissSelectSwapDestinationModal}
          selectedAddress={swapDestinationAddress}
          availableWalletsOnly
          showNoDestinationWalletOption
          showCustomAddressDestinationOption
          showSavedAddresses
          showPublicPrivateToggle
        />
      )}
      {showLiquiditySlippageSelector && showLiquiditySettingsModal && (
        <SlippageSelectorModal
          isRailgun={isRailgunAddress(fromWalletAddress)}
          setFinalSlippagePercentage={setSlippagePercent}
          initialSlippagePercentage={slippagePercent}
          onClose={() => setShowLiquiditySettingsModal(false)}
        />
      )}
      {showSwapSlippageSelector && showSwapSettingsModal && (
        <SlippageSelectorModal
          isRailgun={isRailgunAddress(fromWalletAddress)}
          setFinalSlippagePercentage={setSlippagePercent}
          initialSlippagePercentage={slippagePercent}
          onClose={() => setShowSwapSettingsModal(false)}
        />
      )}
      <div className={styles.reviewSection}>
        <div className={styles.walletNameIconWrapper}>
          {walletIcon(isShieldedFromAddress)}
          <Text className={styles.walletNameText}>
            {wallets.active.name} ({shortenWalletAddress(fromWalletAddress)})
          </Text>
        </div>
        <div className={styles.tokenAmountsWrapper}>
          {recipeFinalERC20Amounts
            ? inputERC20AmountRecipients.map((tokenAmount, index) => {
                return reviewTokenAmount(tokenAmount, index);
              })
            : adjustedERC20AmountRecipients.map(
                (adjustedTokenAmount, index) => {
                  return reviewTokenAmount(
                    adjustedTokenAmount.input,
                    index,
                    adjustedTokenAmount.fee,
                  );
                },
              )}
          {nftAmountRecipients.map((nftAmount, index) =>
            reviewNFTAmount(nftAmount, index),
          )}
        </div>
        {showReceiverWallets() &&
          outputTokenRecipientGroups.map(tokenRecipientGroup => {
            return (
              <div key={tokenRecipientGroup.recipientAddress}>
                <div className={styles.arrowIconWrapper}>
                  {renderIcon(transactionIcon(), 24)}
                </div>
                {showOutputAddress &&
                  outputAddress(
                    isFullyPrivateTransaction,
                    tokenRecipientGroup.recipientAddress,
                  )}
                <div className={styles.tokenAmountsWrapper}>
                  {tokenRecipientGroup.tokenAmounts.map(
                    (outputTokenAmount, index) => {
                      return reviewTokenAmount(
                        outputTokenAmount,
                        index,
                        undefined, true,
                      );
                    },
                  )}
                </div>
              </div>
            );
          })}
        {isSwap && swapQuote && swapBuyTokenAmount && (
          <>
            <div className={styles.arrowIconWrapper}>
              {renderIcon(transactionIcon(), 24)}
            </div>
            {isDefined(swapDestinationAddress) &&
              outputAddress(false, swapDestinationAddress)}
            <div className={styles.tokenAmountsWrapper}>
              {reviewTokenAmount(
                swapBuyTokenAmount,
                0, undefined, true,
              )}
              {modifySwapDestinationAddress()}
              {modifySlippagePercent(openSwapSettings)}
              {minimumReceivedTokenAmounts()}
            </div>
            {swapQuoteOutdated && updateSwapQuote && (
              <TextButton
                text="Price outdated. Click to refresh."
                action={updateSwapQuote}
                containerClassName={styles.swapPriceUpdatedContainer}
                textClassName={styles.swapPriceUpdatedButton}
              />
            )}
          </>
        )}
        {isFarmFeature && (
          <div className={styles.vaultTextWrapper}>
            <Text className={styles.vaultExchangeRateText}>
              {getVaultExchangeRateDisplayText(vault, transactionType)}
            </Text>
            <Text
              className={styles.vaultApyText}
            >{`Current APY: ${expectedVaultApy}%`}</Text>
          </div>
        )}
        {isLiquidity && (
          <>
            <div className={styles.vaultTextWrapper}>
              <Text className={styles.vaultExchangeRateText}>
                {getPairExchangeRateDisplayText(pool)}
              </Text>
            </div>
            {modifySlippagePercent(openLiquiditySettings)}
            {minimumReceivedTokenAmounts()}
          </>
        )}
        {recipeFinalERC20Amounts?.feeERC20AmountRecipients.map(
          (feeERC20Amount, index) => {
            const { amountString, recipientAddress, token } = feeERC20Amount;
            const amount = formatUnitFromHexStringToLocale(
              amountString,
              token.decimals,
            );
            return (
              <div className={styles.recipeFeeTextWrapper} key={index}>
                <Text className={styles.recipeFeeTitle}>
                  {recipientAddress}
                </Text>
                <Text
                  className={styles.recipeFeeAmount}
                >{`${amount} ${getTokenDisplayName(
                  token,
                  wallets.available,
                  network.current.name,
                )}`}</Text>
              </div>
            );
          },
        )}
      </div>
    </>
  );
};

import { FxMintPoolName, KNOWN_POOLS } from '@railgun-community/cookbook';
import {
  isDefined,
  NetworkName,
  NFTAmount,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { useState } from 'react';
import cn from 'classnames';
import { formatUnits } from 'ethers';
import { Button } from '@components/Button/Button';
import { InfoCallout } from '@components/InfoCallout/InfoCallout';
import { MainPagePaddedContainer } from '@components/MainPagePaddedContainer/MainPagePaddedContainer';
import { Slider } from '@components/Slider/Slider';
import { Text } from '@components/Text/Text';
import {
  DrawerName,
  EVENT_OPEN_DRAWER_WITH_DATA,
  FxMintCloseData,
  FxMintOpenData,
  FxMintTopupData,
} from '@models/drawer-types';
import {
  AppSettingsService,
  CalloutType,
  ERC20Amount,
  ERC20Token,
  getFxPoolView,
  SelectTokenPurpose,
  SharedConstants,
  styleguide,
  TransactionType,
  useNFTBalances,
  useReduxSelector,
} from '@react-shared';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { IconType, renderIcon } from '@services/util/icon-service';
import { ERC20AmountsEntry } from '@views/components/amounts-entry/ERC20AmountsEntry';
import { SelectERC20Modal } from '@views/screens/modals/SelectTokenModal/SelectERC20Modal';
import { SlippageSelectorModal } from '@views/screens/modals/SlippageSelectorModal/SlippageSelectorModal';
import styles from './FxMint.module.scss';

const BALANCE_BUCKET_FILTER = [RailgunWalletBalanceBucket.Spendable];

export const FxMintScreen = () => {
  const { network } = useReduxSelector('network');
  const { networkPrices } = useReduxSelector('networkPrices');
  const { wallets } = useReduxSelector('wallets');
  const networkName = network.current.name;
  const isSupported = networkName === NetworkName.Ethereum;

  const { nftBalances } = useNFTBalances(wallets.active, BALANCE_BUCKET_FILTER);
  const positions = (nftBalances?.shielded ?? [])
    .map(nft => {
      const pool = KNOWN_POOLS.find(
        p => p.address.toLowerCase() === nft.nftAddress.toLowerCase(),
      );
      return isDefined(pool)
        ? {
            poolName: pool.name,
            positionId: BigInt(nft.tokenSubID).toString(),
            nft,
          }
        : undefined;
    })
    .filter(isDefined);

  const [selectedPool, setSelectedPool] = useState<Optional<FxMintPoolName>>();
  const [sellTokenAmount, setSellTokenAmount] =
    useState<Optional<ERC20Amount>>();
  const [showAmountEntry, setShowAmountEntry] = useState(true);
  const [loanRatioPercent, setLoanRatioPercent] = useState(50);
  const [slippagePercentage, setSlippagePercentage] = useState(
    SharedConstants.DEFAULT_SLIPPAGE_PRIVATE_TXS,
  );
  const [showSlippageModal, setShowSlippageModal] = useState(false);

  const [topupPositionId, setTopupPositionId] = useState<Optional<string>>();
  const [topupTokenAmount, setTopupTokenAmount] =
    useState<Optional<ERC20Amount>>();
  const [showTopupAmountEntry, setShowTopupAmountEntry] = useState(true);
  const [topupBorrowPercent, setTopupBorrowPercent] = useState(0);

  const [closePosition, setClosePosition] =
    useState<Optional<(typeof positions)[number]>>();

  const tokenPrices =
    networkPrices.forNetwork[networkName]?.forCurrency[
      AppSettingsService.currency.code
    ];

  const usdValueOf = (amount: Optional<ERC20Amount>): number => {
    if (!isDefined(amount)) {
      return 0;
    }
    const tokens = parseFloat(
      formatUnits(BigInt(amount.amountString), amount.token.decimals),
    );
    const price = tokenPrices?.[amount.token.address.toLowerCase()] ?? 0;
    return tokens * price;
  };

  const debtPriceForPool = (poolName: Optional<FxMintPoolName>): number => {
    if (!isDefined(poolName)) {
      return 0;
    }
    const view = getFxPoolView(poolName);
    if (!isDefined(view)) {
      return 0;
    }
    if (view.debtIsFxUSD) {
      return 1;
    }
    return tokenPrices?.[view.debtToken.toLowerCase()] ?? 0;
  };

  const selectedPoolView = isDefined(selectedPool)
    ? getFxPoolView(selectedPool)
    : undefined;
  const collateralValue = usdValueOf(sellTokenAmount);
  const openDebtPrice = debtPriceForPool(selectedPool);
  const targetDebtAmount =
    openDebtPrice > 0
      ? (collateralValue * (loanRatioPercent / 100)) / openDebtPrice
      : 0;
  const targetDebtString =
    targetDebtAmount > 0 ? targetDebtAmount.toFixed(6) : '';
  const validDebt = targetDebtAmount > 0;

  const topupPoolName = positions.find(
    p => p.positionId === topupPositionId,
  )?.poolName;
  const topupPoolView = isDefined(topupPoolName)
    ? getFxPoolView(topupPoolName)
    : undefined;
  const topupDebtPrice = debtPriceForPool(topupPoolName);
  const topupCollateralValue = usdValueOf(topupTokenAmount);
  const topupDebtAmount =
    topupDebtPrice > 0
      ? (topupCollateralValue * (topupBorrowPercent / 100)) / topupDebtPrice
      : 0;
  const topupDebtString = topupDebtAmount > 0 ? topupDebtAmount.toFixed(6) : '';

  const canOpen =
    isSupported &&
    isDefined(selectedPool) &&
    isDefined(sellTokenAmount) &&
    validDebt;

  const handleOpen = () => {
    if (!isDefined(selectedPool) || !isDefined(sellTokenAmount) || !validDebt) {
      return;
    }
    const extraData: FxMintOpenData = {
      pool: selectedPool,
      sellERC20Amount: sellTokenAmount,
      targetDebtString,
      slippagePercentage,
    };
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.FxMintOpen,
      extraData,
    });
  };

  const handleTopup = (
    poolName: FxMintPoolName,
    positionId: string,
    positionNFT: NFTAmount,
  ) => {
    if (!isDefined(topupTokenAmount)) {
      return;
    }
    const extraData: FxMintTopupData = {
      pool: poolName,
      positionId,
      positionNFT,
      sellERC20Amount: topupTokenAmount,
      additionalDebtString: topupDebtString,
      slippagePercentage,
    };
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.FxMintTopup,
      extraData,
    });
  };

  const toggleTopup = (positionId: string) => {
    setTopupPositionId(prev => (prev === positionId ? undefined : positionId));
    setTopupTokenAmount(undefined);
    setShowTopupAmountEntry(true);
    setTopupBorrowPercent(0);
  };

  const onDismissCloseTokenModal = (token?: ERC20Token) => {
    const position = closePosition;
    setClosePosition(undefined);
    if (!isDefined(token) || !isDefined(position)) {
      return;
    }
    const extraData: FxMintCloseData = {
      pool: position.poolName,
      positionId: position.positionId,
      positionNFT: position.nft,
      buyERC20: token,
      slippagePercentage,
    };
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.FxMintClose,
      extraData,
    });
  };

  const renderCallout = (type: CalloutType, text: string) => (
    <InfoCallout type={type} text={text} className={styles.callout} />
  );

  const renderHeader = () => (
    <div className={styles.headerRow}>
      <Text className={styles.headerText}>fxMINT</Text>
      <Text className={styles.headerSubtext}>
        Leveraged positions on f(x) Protocol
      </Text>
    </div>
  );

  if (!isSupported) {
    return (
      <div className={styles.pageContainer}>
        <MainPagePaddedContainer maxWidth={760} minWidth={520}>
          {renderHeader()}
          {renderCallout(
            CalloutType.Info,
            `fxMINT (f(x) Protocol) is only available on Ethereum. ${network.current.publicName} is not supported.`,
          )}
        </MainPagePaddedContainer>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <MainPagePaddedContainer maxWidth={760} minWidth={520}>
        {renderHeader()}
        {renderCallout(
          CalloutType.Info,
          'Your collateral never leaves RAILGUN. Opening, topping up and closing each run in one private batch.',
        )}

        <Text className={styles.sectionHeader}>Your positions</Text>
        {positions.length > 0 ? (
          <div className={styles.formCard}>
            {positions.map(pos => {
              const isExpanded = topupPositionId === pos.positionId;
              const canTopup = isDefined(topupTokenAmount);
              return (
                <div key={pos.positionId} className={styles.positionBlock}>
                  <div className={styles.positionRow}>
                    <div>
                      <Text className={styles.positionPool}>
                        {pos.poolName}
                      </Text>
                      <Text className={styles.positionId}>
                        Position #{pos.positionId}
                      </Text>
                    </div>
                    <div className={styles.positionActions}>
                      <Button
                        buttonClassName={styles.positionActionButton}
                        startIcon={isExpanded ? IconType.Close : IconType.Plus}
                        onClick={() => toggleTopup(pos.positionId)}
                      >
                        {isExpanded ? 'Cancel' : 'Add'}
                      </Button>
                      <Button
                        buttonClassName={styles.positionActionButton}
                        onClick={() => setClosePosition(pos)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className={styles.topupForm}>
                      <Text className={styles.formLabel}>
                        Add collateral from (shielded balance)
                      </Text>
                      <ERC20AmountsEntry
                        transactionType={TransactionType.Swap}
                        canSendMultipleTokens={false}
                        isRailgunBalance={true}
                        initialToken={undefined}
                        requiresAddTokens={undefined}
                        balanceBucketFilter={BALANCE_BUCKET_FILTER}
                        tokenAmounts={
                          topupTokenAmount ? [topupTokenAmount] : []
                        }
                        setTokenAmounts={tokenAmounts =>
                          setTopupTokenAmount(tokenAmounts[0])
                        }
                        showAmountEntry={showTopupAmountEntry}
                        setShowAmountEntry={setShowTopupAmountEntry}
                      />
                      <Text className={styles.formLabel}>
                        Borrow more {topupPoolView?.debtSymbol ?? 'debt'}:{' '}
                        {topupBorrowPercent}% of added value
                      </Text>
                      <Slider
                        defaultValue={0}
                        minValue={0}
                        maxValue={80}
                        step={5}
                        updateValue={setTopupBorrowPercent}
                      />
                      <Text className={styles.debtPreview}>
                        {topupCollateralValue > 0
                          ? `Adding ≈ $${topupCollateralValue.toFixed(2)}${
                              topupDebtAmount > 0
                                ? ` · Borrow ≈ ${topupDebtAmount.toFixed(4)} ${
                                    topupPoolView?.debtSymbol ?? ''
                                  }`
                                : ' · debt unchanged'
                            }`
                          : 'Enter collateral above to add to this position'}
                      </Text>
                      <div className={styles.actionsRow}>
                        <Button
                          startIcon={IconType.Plus}
                          buttonClassName={styles.actionButton}
                          disabled={!canTopup}
                          onClick={() =>
                            handleTopup(pos.poolName, pos.positionId, pos.nft)
                          }
                        >
                          {topupDebtAmount > 0
                            ? 'Add & borrow'
                            : 'Add collateral'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <Text className={styles.emptyText}>
            No open positions yet. Open one below to get started.
          </Text>
        )}

        <div className={styles.formCard}>
          <Text className={styles.sectionHeader}>Open a position</Text>

          <Text className={styles.formLabel}>Pool</Text>
          <div className={styles.poolPills}>
            {KNOWN_POOLS.map(pool => (
              <div
                key={pool.name}
                className={cn(styles.poolPill, {
                  [styles.poolPillSelected]: selectedPool === pool.name,
                })}
                onClick={() => setSelectedPool(pool.name)}
              >
                <Text className={styles.poolPillText}>{pool.name}</Text>
              </div>
            ))}
          </div>

          <Text className={styles.formLabel}>
            Collateral from (shielded balance)
          </Text>
          <ERC20AmountsEntry
            transactionType={TransactionType.Swap}
            canSendMultipleTokens={false}
            isRailgunBalance={true}
            initialToken={undefined}
            requiresAddTokens={undefined}
            balanceBucketFilter={BALANCE_BUCKET_FILTER}
            tokenAmounts={sellTokenAmount ? [sellTokenAmount] : []}
            setTokenAmounts={tokenAmounts =>
              setSellTokenAmount(tokenAmounts[0])
            }
            showAmountEntry={showAmountEntry}
            setShowAmountEntry={setShowAmountEntry}
          />

          <Text className={styles.formLabel}>
            Loan-to-value: {loanRatioPercent}%
          </Text>
          <Slider
            defaultValue={50}
            minValue={0}
            maxValue={80}
            step={5}
            updateValue={setLoanRatioPercent}
          />
          <Text className={styles.debtPreview}>
            {collateralValue > 0 && targetDebtAmount > 0
              ? `Collateral ≈ $${collateralValue.toFixed(
                  2,
                )} · Borrow ≈ ${targetDebtAmount.toFixed(4)} ${
                  selectedPoolView?.debtSymbol ?? ''
                }`
              : isDefined(sellTokenAmount)
              ? 'Waiting for collateral / debt price…'
              : 'Enter collateral above to size the loan'}
          </Text>

          <div
            className={styles.slippageCard}
            onClick={() => setShowSlippageModal(true)}
          >
            <div className={styles.slippageRow}>
              <Text className={styles.slippageText}>{`Slippage: ${(
                slippagePercentage * 100
              ).toFixed(1)}%`}</Text>
              {renderIcon(
                IconType.Settings,
                20,
                styleguide.colors.labelSecondary,
              )}
            </div>
          </div>

          <div className={styles.actionsRow}>
            <Button
              startIcon={IconType.Plus}
              buttonClassName={styles.actionButton}
              disabled={!canOpen}
              onClick={handleOpen}
            >
              Open a position
            </Button>
          </div>
        </div>
      </MainPagePaddedContainer>
      {showSlippageModal && (
        <SlippageSelectorModal
          isRailgun
          setFinalSlippagePercentage={setSlippagePercentage}
          initialSlippagePercentage={slippagePercentage}
          onClose={() => setShowSlippageModal(false)}
        />
      )}
      {isDefined(closePosition) && (
        <SelectERC20Modal
          headerTitle="Receive as"
          skipBaseToken={false}
          onDismiss={onDismissCloseTokenModal}
          isRailgun={true}
          balanceBucketFilter={BALANCE_BUCKET_FILTER}
          purpose={SelectTokenPurpose.Transfer}
          transactionType={TransactionType.Swap}
          hasExistingTokenAmounts={false}
          showAddTokensButton={true}
          useRelayAdaptForBroadcasterFee={false}
        />
      )}
    </div>
  );
};

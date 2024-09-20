import { LiquidityV2Pool } from '@railgun-community/cookbook';
import {
  isDefined,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { Button } from '@components/Button/Button';
import { InfoCallout } from '@components/InfoCallout/InfoCallout';
import { Text } from '@components/Text/Text';
import {
  CalloutType,
  compareTokenAddress,
  CookbookLiquidityRecipeType,
  ERC20Amount,
  ERC20Token,
  ERC20TokenAddressOnly,
  findMatchingAddedTokenForWallet,
  formatNumberToLocaleWithMinDecimals,
  FrontendLiquidityPair,
  getDecimalBalance,
  getLiquidityPoolMoreInfoLink,
  getTokenIconKeyForPair,
  SearchableERC20,
  SharedConstants,
  TransactionType,
  useAddLiquidityRecipe,
  useAppDispatch,
  useERC20BalancesSerialized,
  useLiquidityPoolsForPairFilter,
  useReduxSelector,
} from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import { createExternalSiteAlert } from '@utils/alerts';
import { ERC20AmountsEntry } from '@views/components/amounts-entry/ERC20AmountsEntry';
import { Selector } from '@views/components/Selector/Selector';
import { SlippageSelectorModal } from '@views/screens/modals/SlippageSelectorModal/SlippageSelectorModal';
import {
  AddLiquidityConfirmData,
  LiquidityView,
} from '../LiquidityFlow/LiquidityFlow';
import styles from './AddLiquidityInitial.module.scss';

type PoolOption = {
  label: string;
  value: string;
};

type Props = {
  pool: FrontendLiquidityPair;
  initialTokenAmount?: ERC20Amount;
  cookbookLiquidityRecipeType: CookbookLiquidityRecipeType;
  handleSetView: (view: LiquidityView, data: AddLiquidityConfirmData) => void;
};

export const AddLiquidityInitial = ({
  pool,
  cookbookLiquidityRecipeType,
  initialTokenAmount,
  handleSetView,
}: Props) => {
  const dispatch = useAppDispatch();
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { liquidityPoolList } = useLiquidityPoolsForPairFilter(
    pool,
    network.current.name,
  );
  const useRailgunBalances = true;
  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];
  const { tokenBalancesSerialized } = useERC20BalancesSerialized(
    useRailgunBalances,
    balanceBucketFilter,
  );

  const [showAmountEntry, setShowAmountEntry] = useState(
    !isDefined(initialTokenAmount),
  );
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [slippagePercentage, setSlippagePercentage] = useState(
    SharedConstants.DEFAULT_SLIPPAGE_PRIVATE_TXS,
  );
  const [selectedTokenAmount, setSelectedTokenAmount] =
    useState<Optional<ERC20Amount>>(initialTokenAmount);
  const [selectedPoolOption, setSelectedPoolOption] = useState<PoolOption>();
  const [selectedPool, setSelectedPool] = useState<Optional<LiquidityV2Pool>>();

  const { tokenA, tokenB } = pool;
  const networkName = network.current.name;
  const currentToken = tokenA;
  const transactionType =
    cookbookLiquidityRecipeType === CookbookLiquidityRecipeType.AddLiquidity
      ? TransactionType.AddLiquidity
      : TransactionType.RemoveLiquidity;
  const isRailgunBalance = true;
  const tokenToAdd: Optional<ERC20TokenAddressOnly> = useMemo(
    () =>
      isDefined(selectedPool)
        ? {
            isAddressOnly: true,
            isBaseToken: false,
            address: selectedPool.pairAddress,
            decimals: 18,
          }
        : undefined,
    [selectedPool],
  );
  const pairTokenAlreadyAdded = useMemo(
    () =>
      tokenToAdd
        ? isDefined(
            findMatchingAddedTokenForWallet(
              tokenToAdd,
              wallets.active,
              networkName,
            ),
          )
        : false,
    [networkName, tokenToAdd, wallets.active],
  );
  const poolOptions: Optional<PoolOption[]> = liquidityPoolList?.map(
    ({ pairTokenName, pairAddress }: LiquidityV2Pool) => ({
      label: pairTokenName,
      value: pairAddress,
    }),
  );

  const { tokenUnshieldAmountB } = useAddLiquidityRecipe(
    selectedPool ?? liquidityPoolList[0],
    selectedTokenAmount,
    slippagePercentage,
  );

  useEffect(() => {
    if (poolOptions.length > 0 && !selectedPoolOption) {
      setSelectedPoolOption(poolOptions[0]);
    }

    const pool = liquidityPoolList?.find(pool =>
      compareTokenAddress(pool.pairAddress, selectedPoolOption?.value),
    );
    setSelectedPool(pool);
  }, [liquidityPoolList, poolOptions, selectedPoolOption]);

  const getUserBalanceForTokenB = () => {
    const balance = tokenBalancesSerialized[tokenB.address.toLowerCase()];

    if (isDefined(balance)) {
      const userBalanceDecimal = getDecimalBalance(
        BigInt(balance),
        tokenB.decimals,
      );

      return userBalanceDecimal;
    }

    return undefined;
  };

  const userBalanceForTokenB = getUserBalanceForTokenB();

  const hasBalanceForTokenB = () => {
    if (isDefined(userBalanceForTokenB) && isDefined(tokenBAmount)) {
      const calculatedBalanceDecimal = getDecimalBalance(
        BigInt(tokenBAmount.amountString),
        tokenB.decimals,
      );

      return userBalanceForTokenB > calculatedBalanceDecimal;
    }

    return false;
  };

  const handleNextStep = () => {
    if (
      !selectedTokenAmount ||
      !tokenUnshieldAmountB ||
      !isDefined(selectedPool)
    ) {
      return;
    }

    const data: AddLiquidityConfirmData = {
      selectedPool,
      slippagePercentage,
      tokenAmountA: selectedTokenAmount,
      tokenAmountB: tokenUnshieldAmountB,
    };
    handleSetView(LiquidityView.ADD_CONFIRM, data);
  };

  const goToPoolInfo = () => {
    if (!isDefined(selectedPool)) {
      return;
    }
    const poolInfoLink = getLiquidityPoolMoreInfoLink(
      selectedPool.uniswapV2Fork,
      selectedPool.pairAddress,
      network.current.chain.id,
    );

    createExternalSiteAlert(poolInfoLink, setAlert, dispatch);
  };

  const basicTokenToAdd: Optional<ERC20Token> = isDefined(selectedPool)
    ? {
        isAddressOnly: false,
        address: selectedPool.pairAddress.toLowerCase(),
        name: selectedPool.pairTokenName,
        symbol: selectedPool.pairTokenSymbol,
        decimals: 18,
        isBaseToken: false,
      }
    : undefined;
  const tokenToAddInfo: Optional<SearchableERC20> =
    isDefined(basicTokenToAdd) && isDefined(selectedPool)
      ? {
          ...basicTokenToAdd,
          searchStr: '',
          icon: getTokenIconKeyForPair(selectedPool.uniswapV2Fork),
        }
      : undefined;

  const addTokenDescription = `When you deposit ${tokenA.symbol} and ${tokenB.symbol} into ${selectedPool?.name}, you will receive ${selectedPool?.pairTokenSymbol}, which represents your position in the liquidity pool.`;
  const headerText = `Select a pool source and amount of shielded ${tokenA.symbol} to add to the Liquidity Pool.`;
  const tokenBAmount: ERC20Amount = tokenUnshieldAmountB ?? {
    token: tokenB,
    amountString: '0',
  };
  const showErrorBalance = !hasBalanceForTokenB();
  const errorMessage: Optional<Error> =
    showErrorBalance && isDefined(userBalanceForTokenB)
      ? new Error(
          `Shielded balance too low: ${formatNumberToLocaleWithMinDecimals(
            userBalanceForTokenB,
            2,
          )} ${tokenB.symbol}.`,
        )
      : undefined;

  return (
    <>
      <div className={styles.sendInitialContainer}>
        <Text className={styles.description}>{headerText}</Text>
        <Text className={styles.selectPoolLabel}>Select pool:</Text>
        <Selector
          options={poolOptions ?? []}
          value={selectedPoolOption}
          placeholder="Select pool"
          onValueChange={option => {
            setSelectedPoolOption(option as PoolOption);
          }}
          testId="pool-selector"
        />
        {isDefined(selectedPool) && (
          <div className={styles.poolMoreInfoLinkContainer}>
            <Text className={styles.poolMoreInfoLink} onClick={goToPoolInfo}>
              View pool details
            </Text>
          </div>
        )}
        <Text className={styles.settingsLabel}>Settings:</Text>
        <div
          className={styles.itemCard}
          onClick={() => {
            setShowSettingsModal(true);
          }}
        >
          <div className={styles.phraseHeader}>
            <Text className={styles.slippageText}>{`Slippage: ${(
              slippagePercentage * 100
            ).toFixed(1)}%`}</Text>
            {renderIcon(IconType.Settings, 20)}
          </div>
        </div>
        <ERC20AmountsEntry
          transactionType={transactionType}
          canSendMultipleTokens={false}
          isRailgunBalance={isRailgunBalance}
          balanceBucketFilter={balanceBucketFilter}
          initialToken={currentToken}
          disableERC20Selection={true}
          requiresAddTokens={
            selectedTokenAmount && !pairTokenAlreadyAdded && tokenToAddInfo
              ? [tokenToAddInfo]
              : undefined
          }
          requiresAddTokenDescription={addTokenDescription}
          tokenAmounts={selectedTokenAmount ? [selectedTokenAmount] : []}
          calculatedError={errorMessage}
          calculatedTokenAmounts={isDefined(tokenBAmount) ? [tokenBAmount] : []}
          setTokenAmounts={tokenAmounts => {
            if (!tokenAmounts.length) {
              setSelectedTokenAmount(undefined);
              return;
            }
            setSelectedTokenAmount(tokenAmounts[0]);
          }}
          showAmountEntry={showAmountEntry}
          setShowAmountEntry={setShowAmountEntry}
        />
        {selectedTokenAmount && pairTokenAlreadyAdded && (
          <>
            <InfoCallout
              type={CalloutType.Secure}
              text={addTokenDescription}
              className={styles.infoCalloutReady}
            />
            <Button
              buttonClassName={styles.button}
              textClassName={styles.buttonText}
              onClick={handleNextStep}
              testId="send-erc20-next-button"
              disabled={showErrorBalance}
            >
              Next
            </Button>
          </>
        )}
      </div>
      {alert && <GenericAlert {...alert} />}
      {showSettingsModal && (
        <SlippageSelectorModal
          isRailgun
          setFinalSlippagePercentage={setSlippagePercentage}
          initialSlippagePercentage={slippagePercentage}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </>
  );
};

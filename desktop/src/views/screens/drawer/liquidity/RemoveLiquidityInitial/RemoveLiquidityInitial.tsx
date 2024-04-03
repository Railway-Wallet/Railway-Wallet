import {
  isDefined,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { useState } from 'react';
import { Text } from '@components/Text/Text';
import {
  CalloutType,
  CookbookLiquidityRecipeType,
  ERC20Amount,
  ERC20Token,
  getTokenIconKeyForPair,
  SharedConstants,
  TransactionType,
  useGetLiquidityTokensToAdd,
  useLiquidityPoolForAddressFilter,
  useReduxSelector,
} from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import { ERC20AmountsEntry } from '@views/components/amounts-entry/ERC20AmountsEntry';
import { Button } from '@views/components/Button/Button';
import { InfoCallout } from '@views/components/InfoCallout/InfoCallout';
import { LiquiditySettingsModal } from '@views/screens/modals/LiquiditySettingsModal/LiquiditySettingsModal';
import {
  LiquidityView,
  RemoveLiquidityConfirmData,
} from '../LiquidityFlow/LiquidityFlow';
import styles from './RemoveLiquidityInitial.module.scss';

type Props = {
  tokenAddress: string;
  initialTokenAmount?: ERC20Amount;
  cookbookLiquidityRecipeType: CookbookLiquidityRecipeType;
  handleSetView: (
    view: LiquidityView,
    data: RemoveLiquidityConfirmData,
  ) => void;
};

export const RemoveLiquidityInitial = ({
  tokenAddress,
  handleSetView,
  initialTokenAmount,
}: Props) => {
  const isRailgunBalance = true;
  const { network } = useReduxSelector('network');
  const { liquidityPool } = useLiquidityPoolForAddressFilter(
    tokenAddress,
    network.current.name,
  );
  const { tokensToAdd } = useGetLiquidityTokensToAdd(liquidityPool);

  const [selectedTokenAmount, setSelectedTokenAmount] =
    useState<Optional<ERC20Amount>>(initialTokenAmount);
  const [showAmountEntry, setShowAmountEntry] = useState(
    !isDefined(initialTokenAmount),
  );
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [slippagePercentage, setSlippagePercentage] = useState(
    SharedConstants.DEFAULT_SLIPPAGE_PRIVATE_TXS,
  );

  const handleNextStep = () => {
    if (!selectedTokenAmount || !isDefined(liquidityPool)) {
      return;
    }

    const data: RemoveLiquidityConfirmData = {
      tokenAmount: selectedTokenAmount,
      liquidityPool,
      slippagePercentage,
    };
    handleSetView(LiquidityView.REMOVE_CONFIRM, data);
  };

  const addTokenDescription = `When you redeem ${liquidityPool?.pairTokenSymbol} from the liquidity pool, you will receive ${liquidityPool?.tokenSymbolA} and ${liquidityPool?.tokenSymbolB}.`;
  const headerText = `Select the amount of ${liquidityPool?.pairTokenSymbol} you would like to remove from ${liquidityPool?.name}.`;
  const currentToken: Optional<ERC20Token> = isDefined(liquidityPool)
    ? {
        isAddressOnly: false,
        name: liquidityPool?.pairTokenName,
        address: liquidityPool?.pairAddress,
        symbol: liquidityPool?.pairTokenSymbol,
        decimals: Number(liquidityPool?.pairTokenDecimals),
        icon: getTokenIconKeyForPair(liquidityPool.uniswapV2Fork),
      }
    : undefined;

  const showNextButton =
    isDefined(selectedTokenAmount) &&
    (!isDefined(tokensToAdd) || tokensToAdd.length === 0);

  return (
    <>
      <div className={styles.sendInitialContainer}>
        <Text className={styles.description}>{headerText}</Text>
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
          transactionType={TransactionType.RemoveLiquidity}
          canSendMultipleTokens={false}
          isRailgunBalance={isRailgunBalance}
          balanceBucketFilter={[RailgunWalletBalanceBucket.Spendable]}
          initialToken={currentToken}
          disableERC20Selection={true}
          requiresAddTokens={tokensToAdd}
          requiresAddTokenDescription={addTokenDescription}
          tokenAmounts={selectedTokenAmount ? [selectedTokenAmount] : []}
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
        {showNextButton && (
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
            >
              Next
            </Button>
          </>
        )}
      </div>
      {showSettingsModal && (
        <LiquiditySettingsModal
          setFinalSlippagePercentage={setSlippagePercentage}
          initialSlippagePercentage={slippagePercentage}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </>
  );
};

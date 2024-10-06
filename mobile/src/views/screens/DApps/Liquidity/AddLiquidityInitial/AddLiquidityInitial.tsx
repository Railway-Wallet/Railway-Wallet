import { LiquidityV2Pool } from "@railgun-community/cookbook";
import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import React, { useEffect, useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ButtonWithTextAndIcon } from "@components/buttons/ButtonWithTextAndIcon/ButtonWithTextAndIcon";
import { InfoCallout } from "@components/callouts/InfoCallout/InfoCallout";
import { FooterButtonAndroid } from "@components/footers/FooterButtonAndroid/FooterButtonAndroid";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { ERC20AmountsNumPadView } from "@components/views/ERC20AmountsNumPadView/ERC20AmountsNumPadView";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { DAppsStackParamList } from "@models/navigation-models";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import {
  CalloutType,
  compareTokenAddress,
  convertLiquidityPoolToSerialized,
  ERC20Amount,
  ERC20Token,
  ERC20TokenAddressOnly,
  findMatchingAddedTokenForWallet,
  formatNumberToLocaleWithMinDecimals,
  getDecimalBalance,
  getTokenIconKeyForPair,
  SearchableERC20,
  SharedConstants,
  TransactionType,
  useAddLiquidityRecipe,
  useERC20BalancesSerialized,
  useLiquidityPoolsForPairFilter,
  useReduxSelector,
} from "@react-shared";
import { AddCustomTokenModal } from "@screens/modals/AddCustomTokenModal/AddCustomTokenModal";
import { callActionSheet } from "@services/util/action-sheet-options-service";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { AppHeader } from "@views/components/headers/AppHeader/AppHeader";
import { HeaderTextButton } from "@views/components/headers/headerSideComponents/HeaderTextButton/HeaderTextButton";
import { TextEntry } from "@views/components/inputs/TextEntry/TextEntry";
import { sharedStyles } from "../sharedStyles";

type PoolOption = {
  label: string;
  value: string;
};

type Props = {
  navigation: NavigationProp<DAppsStackParamList, "AddLiquidityInitial">;
  route: RouteProp<
    { params: DAppsStackParamList["AddLiquidityInitial"] },
    "params"
  >;
};

export const AddLiquidityInitial: React.FC<Props> = ({ route, navigation }) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { pool, initialTokenAmount } = route.params;
  const { tokenA, tokenB } = pool;
  const isRailgun = true;
  const networkName = network.current.name;
  const currentToken = tokenA;

  const [erc20Amounts, setERC20Amounts] = useState<ERC20Amount[]>(
    isDefined(initialTokenAmount) ? [initialTokenAmount] : []
  );
  const [showAmountEntry, setShowAmountEntry] = useState(true);
  const [selectedPoolOption, setSelectedPoolOption] = useState<PoolOption>();
  const [selectedPool, setSelectedPool] = useState<Optional<LiquidityV2Pool>>();
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);

  const { showActionSheetWithOptions } = useActionSheet();
  const { liquidityPoolList } = useLiquidityPoolsForPairFilter(
    pool,
    network.current.name
  );
  const { tokenUnshieldAmountB } = useAddLiquidityRecipe(
    selectedPool ?? liquidityPoolList[0],
    erc20Amounts[0],
    SharedConstants.DEFAULT_SLIPPAGE_PRIVATE_TXS
  );

  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];

  const { tokenBalancesSerialized } = useERC20BalancesSerialized(
    isRailgun,
    balanceBucketFilter
  );

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
    [selectedPool]
  );
  const pairTokenAlreadyAdded = useMemo(
    () =>
      tokenToAdd
        ? isDefined(
            findMatchingAddedTokenForWallet(
              tokenToAdd,
              wallets.active,
              networkName
            )
          )
        : false,
    [wallets.active, networkName, tokenToAdd]
  );
  const poolOptions: Optional<PoolOption[]> = liquidityPoolList?.map(
    ({ pairTokenName, pairAddress }: LiquidityV2Pool) => ({
      label: pairTokenName,
      value: pairAddress,
    })
  );

  useEffect(() => {
    if (poolOptions.length > 0 && !selectedPoolOption) {
      setSelectedPoolOption(poolOptions[0]);
    }

    const pool = liquidityPoolList?.find((pool) =>
      compareTokenAddress(pool.pairAddress, selectedPoolOption?.value)
    );
    setSelectedPool(pool);
  }, [liquidityPoolList, poolOptions, selectedPoolOption]);

  const getUserBalanceForTokenB = () => {
    const balance = tokenBalancesSerialized[tokenB.address.toLowerCase()];

    if (isDefined(balance)) {
      const userBalanceDecimal = getDecimalBalance(
        BigInt(balance),
        tokenB.decimals
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
        tokenB.decimals
      );

      return userBalanceForTokenB > calculatedBalanceDecimal;
    }

    return false;
  };

  const handleNextStep = () => {
    if (
      erc20Amounts?.length === 0 ||
      !tokenUnshieldAmountB ||
      !isDefined(selectedPool)
    ) {
      return;
    }

    triggerHaptic(HapticSurface.NavigationButton);
    navigation.navigate("AddLiquidityConfirm", {
      selectedPoolSerialized: convertLiquidityPoolToSerialized(selectedPool),
      tokenAmountA: erc20Amounts[0],
      tokenAmountB: tokenUnshieldAmountB,
    });
  };

  const openAddTokenModal = () => {
    setShowAddTokenModal(true);
  };

  const onTapChangePool = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    const buttons =
      poolOptions?.map((p) => {
        return {
          name: p.label,
          action: () => setSelectedPoolOption(p),
        };
      }) ?? [];

    callActionSheet(showActionSheetWithOptions, "Select pool", buttons);
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
          searchStr: "",
          icon: getTokenIconKeyForPair(selectedPool.uniswapV2Fork),
        }
      : undefined;
  const tokenBAmount: ERC20Amount = tokenUnshieldAmountB ?? {
    token: tokenB,
    amountString: "0",
  };
  const addTokenDescription = `When you deposit ${tokenA.symbol} and ${tokenB.symbol} into ${selectedPool?.name}, you will receive ${selectedPool?.pairTokenSymbol}, which represents your position in the liquidity pool.`;
  const showErrorBalance = !hasBalanceForTokenB();
  const errorMessage =
    showErrorBalance && isDefined(userBalanceForTokenB)
      ? `Shielded balance too low: ${formatNumberToLocaleWithMinDecimals(
          userBalanceForTokenB,
          2
        )} ${tokenB.symbol}.`
      : undefined;

  return (
    <>
      <AppHeader
        title={`Add liquidity: ${tokenA.symbol}-${tokenB.symbol}`}
        headerLeft={<HeaderBackButton />}
        headerRight={
          <HeaderTextButton
            text="Next"
            onPress={handleNextStep}
            disabled={showErrorBalance}
          />
        }
      />
      <View style={sharedStyles.container}>
        <TouchableOpacity
          style={sharedStyles.item}
          activeOpacity={0.8}
          onPress={onTapChangePool}
        >
          <TextEntry
            label="Select pool"
            value={selectedPoolOption?.label}
            iconButtons={[
              {
                icon: "pencil-outline",
                onTap: onTapChangePool,
              },
            ]}
            editable={false}
          />
        </TouchableOpacity>
        <ERC20AmountsNumPadView
          focused
          disableERC20Selection
          erc20Amounts={erc20Amounts}
          isRailgunBalance={isRailgun}
          canSendMultipleTokens={false}
          calculatedError={errorMessage}
          navigationToken={currentToken}
          showAmountEntry={showAmountEntry}
          setTokenAmounts={setERC20Amounts}
          calculatedTokenAmounts={[tokenBAmount]}
          setShowAmountEntry={setShowAmountEntry}
          transactionType={TransactionType.AddLiquidity}
          balanceBucketFilter={balanceBucketFilter}
        />
        {!showAmountEntry && (
          <>
            {!pairTokenAlreadyAdded ? (
              <>
                <Text style={sharedStyles.addTokenDescription}>
                  {addTokenDescription}
                </Text>
                <ButtonWithTextAndIcon
                  icon="plus"
                  title={`Add ${
                    tokenToAddInfo?.symbol ?? selectedPool?.pairTokenSymbol
                  } to wallet`}
                  onPress={() => {
                    triggerHaptic(HapticSurface.SelectItem);
                    openAddTokenModal();
                  }}
                  additionalStyles={sharedStyles.addTokenButton}
                />
              </>
            ) : (
              <>
                <InfoCallout
                  type={CalloutType.Secure}
                  text={addTokenDescription}
                  style={sharedStyles.infoCalloutReady}
                />
                <FooterButtonAndroid
                  buttonAction={handleNextStep}
                  buttonTitle="Next"
                  disabled={showErrorBalance}
                />
              </>
            )}
          </>
        )}
      </View>
      <AddCustomTokenModal
        initialFullToken={tokenToAddInfo}
        onClose={() => setShowAddTokenModal(false)}
        show={showAddTokenModal}
      />
    </>
  );
};

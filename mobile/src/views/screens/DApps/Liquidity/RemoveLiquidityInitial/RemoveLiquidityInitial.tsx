import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { ButtonWithTextAndIcon } from "@components/buttons/ButtonWithTextAndIcon/ButtonWithTextAndIcon";
import { InfoCallout } from "@components/callouts/InfoCallout/InfoCallout";
import { FooterButtonAndroid } from "@components/footers/FooterButtonAndroid/FooterButtonAndroid";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { ERC20AmountsNumPadView } from "@components/views/ERC20AmountsNumPadView/ERC20AmountsNumPadView";
import { DAppsStackParamList } from "@models/navigation-models";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import {
  CalloutType,
  ERC20Amount,
  ERC20Token,
  getTokenIconKeyForPair,
  TransactionType,
  useAddMultipleTokens,
  useGetLiquidityTokensToAdd,
  useLiquidityPoolForAddressFilter,
  useReduxSelector,
} from "@react-shared";
import { AddCustomTokenModal } from "@screens/modals/AddCustomTokenModal/AddCustomTokenModal";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { AppHeader } from "@views/components/headers/AppHeader/AppHeader";
import { HeaderTextButton } from "@views/components/headers/headerSideComponents/HeaderTextButton/HeaderTextButton";
import { sharedStyles } from "../sharedStyles";

type Props = {
  navigation: NavigationProp<DAppsStackParamList, "RemoveLiquidityInitial">;
  route: RouteProp<
    { params: DAppsStackParamList["RemoveLiquidityInitial"] },
    "params"
  >;
};

export const RemoveLiquidityInitial: React.FC<Props> = ({
  route,
  navigation,
}) => {
  const { network } = useReduxSelector("network");
  const { tokenAddress, initialTokenAmount } = route.params;
  const networkName = network.current.name;
  const isRailgun = true;

  const { liquidityPool } = useLiquidityPoolForAddressFilter(
    tokenAddress,
    networkName
  );
  const { tokensToAdd } = useGetLiquidityTokensToAdd(liquidityPool);
  const { currentTokenToAdd, onTokenAddSuccess } =
    useAddMultipleTokens(tokensToAdd);

  const [erc20Amounts, setERC20Amounts] = useState<ERC20Amount[]>(
    isDefined(initialTokenAmount) ? [initialTokenAmount] : []
  );
  const [showAmountEntry, setShowAmountEntry] = useState(
    !isDefined(initialTokenAmount)
  );
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);

  const handleNextStep = () => {
    if (erc20Amounts?.length === 0 || !isDefined(liquidityPool)) {
      return;
    }

    triggerHaptic(HapticSurface.NavigationButton);
    navigation.navigate("RemoveLiquidityConfirm", {
      tokenAmount: erc20Amounts[0],
      liquidityPool,
    });
  };

  const addTokenDescription = `When you redeem ${liquidityPool?.pairTokenSymbol} from the liquidity pool, you will receive ${liquidityPool?.tokenSymbolA} and ${liquidityPool?.tokenSymbolB}.`;
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

  const openAddTokenModal = () => {
    setShowAddTokenModal(true);
  };

  const showNextButton =
    erc20Amounts.length > 0 &&
    (!isDefined(tokensToAdd) || tokensToAdd.length === 0);

  return (
    <>
      <AppHeader
        title={`Remove liquidity: ${liquidityPool?.pairTokenName}`}
        headerLeft={<HeaderBackButton />}
        headerRight={
          <HeaderTextButton
            text="Next"
            onPress={handleNextStep}
            disabled={!showNextButton}
          />
        }
      />
      <View style={sharedStyles.container}>
        <ERC20AmountsNumPadView
          focused
          disableERC20Selection
          erc20Amounts={erc20Amounts}
          isRailgunBalance={isRailgun}
          canSendMultipleTokens={false}
          navigationToken={currentToken}
          showAmountEntry={showAmountEntry}
          setTokenAmounts={setERC20Amounts}
          setShowAmountEntry={setShowAmountEntry}
          transactionType={TransactionType.RemoveLiquidity}
          balanceBucketFilter={[RailgunWalletBalanceBucket.Spendable]}
        />
        {!showAmountEntry && (
          <>
            {isDefined(currentTokenToAdd) ? (
              <>
                <Text style={sharedStyles.addTokenDescription}>
                  {addTokenDescription}
                </Text>
                <ButtonWithTextAndIcon
                  icon="plus"
                  title={`Add ${currentTokenToAdd.symbol} to wallet`}
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
                  disabled={!showNextButton}
                />
              </>
            )}
          </>
        )}
      </View>
      <AddCustomTokenModal
        initialFullToken={currentTokenToAdd}
        onClose={() => setShowAddTokenModal(false)}
        show={showAddTokenModal}
        onSuccessAddedToken={onTokenAddSuccess}
      />
    </>
  );
};

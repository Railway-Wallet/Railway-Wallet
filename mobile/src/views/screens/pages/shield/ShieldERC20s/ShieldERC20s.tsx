import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import React, { useRef, useState } from "react";
import { Alert, TextInput } from "react-native";
import { FooterButtonAndroid } from "@components/footers/FooterButtonAndroid/FooterButtonAndroid";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { HeaderTextButton } from "@components/headers/headerSideComponents/HeaderTextButton/HeaderTextButton";
import { ERC20AmountsNumPadView } from "@components/views/ERC20AmountsNumPadView/ERC20AmountsNumPadView";
import { useRecipientAddress } from "@hooks/inputs/useRecipientAddress";
import { TokenStackParamList } from "@models/navigation-models";
import {
  CommonActions,
  NavigationProp,
  RouteProp,
} from "@react-navigation/native";
import {
  ERC20Amount,
  ERC20Token,
  maxBigIntForTransaction,
  TransactionType,
  useRailgunShieldSpenderContract,
  WalletAddressType,
} from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { validateWalletAddress } from "@utils/validation";

type Props = {
  navigation: NavigationProp<TokenStackParamList, "ShieldToken">;
  route: RouteProp<{ params: TokenStackParamList["ShieldToken"] }, "params">;
};

export const ShieldERC20s: React.FC<Props> = ({ navigation, route }) => {
  const { token: navigationToken } = route.params;

  const [erc20Amounts, setERC20Amounts] = useState<ERC20Amount[]>([]);
  const [showAmountEntry, setShowAmountEntry] = useState(true);

  const transactionType = TransactionType.Shield;
  const walletAddressType = WalletAddressType.Railgun;

  const { shieldApproveSpender, shieldApproveSpenderName } =
    useRailgunShieldSpenderContract();

  const { hasValidRecipient, erc20AmountRecipients, recipientInput } =
    useRecipientAddress(
      undefined,
      undefined,
      erc20Amounts,
      [],
      transactionType,
      walletAddressType,
      validateWalletAddress
    );

  const onTapNext = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    if (!hasValidRecipient) {
      Alert.alert("Please enter a valid address");
      return;
    }

    navigation.navigate("ShieldERC20sConfirm", {
      erc20AmountRecipients: erc20AmountRecipients,
      nftAmountRecipients: [],
    });
  };

  const onSuccessCallback = () => {
    navigation.dispatch(
      CommonActions.navigate("Token", {
        screen: "ShieldToken",
        params: {},
      })
    );
  };

  const openApproveForShielding = (token: ERC20Token) => {
    const approveTokenAmount: ERC20Amount = {
      token,
      amountString: maxBigIntForTransaction().toString(),
    };
    if (!isDefined(shieldApproveSpender)) {
      Alert.alert("Error", "No spender contract for this network.");
      return;
    }
    navigation.navigate("ApproveTokenConfirm", {
      spender: shieldApproveSpender,
      spenderName: shieldApproveSpenderName,
      tokenAmount: approveTokenAmount,
      infoCalloutText: `Approving token for shielding: ${shieldApproveSpenderName}.`,
      transactionType: TransactionType.ApproveShield,
      onSuccessCallback,
    });
  };

  const addressEntryRef = useRef<TextInput | null>(null);

  return (
    <>
      <AppHeader
        title="Shield tokens"
        headerLeft={<HeaderBackButton />}
        headerRight={
          <HeaderTextButton
            text="Next"
            onPress={onTapNext}
            disabled={showAmountEntry || !hasValidRecipient}
          />
        }
        isModal={false}
      />
      {recipientInput}
      <ERC20AmountsNumPadView
        transactionType={transactionType}
        canSendMultipleTokens={true}
        isRailgunBalance={false}
        navigationToken={navigationToken}
        showAmountEntry={showAmountEntry}
        setShowAmountEntry={setShowAmountEntry}
        erc20Amounts={erc20Amounts}
        setTokenAmounts={setERC20Amounts}
        openApproveForShielding={openApproveForShielding}
        focused={!(addressEntryRef.current?.isFocused() ?? false)}
        onTouchEnd={() => addressEntryRef.current?.blur()}
        balanceBucketFilter={[RailgunWalletBalanceBucket.Spendable]}
      />
      {!showAmountEntry && (
        <FooterButtonAndroid
          buttonAction={onTapNext}
          buttonTitle="Next"
          disabled={!hasValidRecipient}
        />
      )}
    </>
  );
};

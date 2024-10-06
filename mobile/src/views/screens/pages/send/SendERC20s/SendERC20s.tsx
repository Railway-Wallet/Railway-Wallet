import { RailgunWalletBalanceBucket } from "@railgun-community/shared-models";
import React, { useRef, useState } from "react";
import { Alert, TextInput } from "react-native";
import { FooterButtonAndroid } from "@components/footers/FooterButtonAndroid/FooterButtonAndroid";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { HeaderTextButton } from "@components/headers/headerSideComponents/HeaderTextButton/HeaderTextButton";
import { ERC20AmountsNumPadView } from "@components/views/ERC20AmountsNumPadView/ERC20AmountsNumPadView";
import { useRecipientAddress } from "@hooks/inputs/useRecipientAddress";
import { TokenStackParamList } from "@models/navigation-models";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import { ERC20Amount, TransactionType, WalletAddressType } from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { validateWalletAddress } from "@utils/validation";

type Props = {
  navigation: NavigationProp<TokenStackParamList, "SendERC20s">;
  route: RouteProp<{ params: TokenStackParamList["SendERC20s"] }, "params">;
};

export const SendERC20s: React.FC<Props> = ({ navigation, route }) => {
  const { isRailgun, token: navigationToken } = route.params;

  const [erc20Amounts, setERC20Amounts] = useState<ERC20Amount[]>([]);
  const [showAmountEntry, setShowAmountEntry] = useState(true);

  const transactionType = TransactionType.Send;
  const walletAddressType = isRailgun
    ? WalletAddressType.Railgun
    : WalletAddressType.Ethereum;

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

    navigation.navigate("SendERC20sConfirm", {
      isRailgun: isRailgun,
      erc20AmountRecipients: erc20AmountRecipients,
      nftAmountRecipients: [],
    });
  };

  const addressEntryRef = useRef<TextInput | null>(null);

  return (
    <>
      <AppHeader
        title={`Send ${isRailgun ? "shielded" : "unshielded"} tokens`}
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
        canSendMultipleTokens={isRailgun}
        isRailgunBalance={isRailgun}
        navigationToken={navigationToken}
        showAmountEntry={showAmountEntry}
        setShowAmountEntry={setShowAmountEntry}
        erc20Amounts={erc20Amounts}
        setTokenAmounts={setERC20Amounts}
        focused={!(addressEntryRef.current?.isFocused() ?? false)}
        onTouchEnd={() => addressEntryRef.current?.blur()}
        balanceBucketFilter={[RailgunWalletBalanceBucket.Spendable]}
      />
      {!showAmountEntry && (
        <FooterButtonAndroid
          buttonAction={onTapNext}
          buttonTitle="Next"
          disabled={showAmountEntry}
        />
      )}
    </>
  );
};

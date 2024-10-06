import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import React, { useEffect, useRef, useState } from "react";
import { Alert, AlertButton, TextInput } from "react-native";
import { FooterButtonAndroid } from "@components/footers/FooterButtonAndroid/FooterButtonAndroid";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { HeaderTextButton } from "@components/headers/headerSideComponents/HeaderTextButton/HeaderTextButton";
import { ERC20AmountsNumPadView } from "@components/views/ERC20AmountsNumPadView/ERC20AmountsNumPadView";
import { useRecipientAddress } from "@hooks/inputs/useRecipientAddress";
import { TokenStackParamList } from "@models/navigation-models";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import {
  ERC20Amount,
  getTokenDisplayNameShort,
  hasOnlyWrappedBaseToken,
  SharedConstants,
  StorageService,
  TransactionType,
  useReduxSelector,
  WalletAddressType,
} from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { validateWalletAddress } from "@utils/validation";

type Props = {
  navigation: NavigationProp<TokenStackParamList, "UnshieldERC20s">;
  route: RouteProp<{ params: TokenStackParamList["UnshieldERC20s"] }, "params">;
};

export const UnshieldERC20s: React.FC<Props> = ({ navigation, route }) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const { token: navigationToken } = route.params;

  const [erc20Amounts, setERC20Amounts] = useState<ERC20Amount[]>([]);
  const [showAmountEntry, setShowAmountEntry] = useState(true);
  const [balanceBucketFilter] = useState<RailgunWalletBalanceBucket[]>([
    RailgunWalletBalanceBucket.Spendable,
  ]);

  const transactionType = TransactionType.Unshield;
  const walletAddressType = WalletAddressType.Ethereum;

  useEffect(() => {
    const checkUnshieldDisclaimer = async () => {
      const hasSeen = await StorageService.getItem(
        SharedConstants.HAS_SEEN_UNSHIELD_DESTINATION_DISCLAIMER
      );

      if (!isDefined(hasSeen)) {
        Alert.alert(
          `Careful!`,
          "Unshielding directly to an exchange or broker may result in loss of funds. Only unshield to a self-custodial wallet first before sending on to an exchange or broker."
        );

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        StorageService.setItem(
          SharedConstants.HAS_SEEN_UNSHIELD_DESTINATION_DISCLAIMER,
          "1"
        );
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    checkUnshieldDisclaimer();
  }, []);

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
    if (!hasValidRecipient) {
      Alert.alert("Please enter a valid address");
      return;
    }

    const showBaseTokenUnshieldOptions = hasOnlyWrappedBaseToken(
      erc20Amounts,
      network.current
    );
    if (showBaseTokenUnshieldOptions) {
      goToNextUnshieldBaseToken();
      return;
    }

    const isBaseTokenUnshield = false;
    navigateNext(isBaseTokenUnshield);
  };

  const goToNextUnshieldBaseToken = () => {
    const buttons: AlertButton[] = [
      {
        text: `Unshield to ${network.current.baseToken.symbol}`,
        onPress: () => navigateNext(true),
      },
      {
        text: `Unshield to ${network.current.baseToken.wrappedSymbol}`,
        onPress: () => navigateNext(false),
      },
    ];
    Alert.alert(
      `Unshield ${getTokenDisplayNameShort(
        erc20Amounts[0].token,
        wallets.available,
        network.current.name
      )}`,
      `You may unshield this wrapped token to ${network.current.baseToken.symbol} or ${network.current.baseToken.wrappedSymbol}.`,
      buttons
    );
  };

  const navigateNext = (isBaseTokenUnshield: boolean) => {
    triggerHaptic(HapticSurface.NavigationButton);

    navigation.navigate("UnshieldERC20sConfirm", {
      erc20AmountRecipients: erc20AmountRecipients,
      isBaseTokenUnshield,
      nftAmountRecipients: [],
      balanceBucketFilter: balanceBucketFilter,
      unshieldToOriginShieldTxid: undefined,
    });
  };

  const addressEntryRef = useRef<TextInput | null>(null);

  return (
    <>
      <AppHeader
        title="Unshield tokens"
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
        isRailgunBalance={true}
        navigationToken={navigationToken}
        showAmountEntry={showAmountEntry}
        setShowAmountEntry={setShowAmountEntry}
        erc20Amounts={erc20Amounts}
        setTokenAmounts={setERC20Amounts}
        focused={!(addressEntryRef.current?.isFocused() ?? false)}
        onTouchEnd={() => addressEntryRef.current?.blur()}
        balanceBucketFilter={balanceBucketFilter}
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

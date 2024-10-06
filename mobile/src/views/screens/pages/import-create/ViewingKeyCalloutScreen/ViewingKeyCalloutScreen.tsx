import React from "react";
import { InfoCallout } from "@components/callouts/InfoCallout/InfoCallout";
import { FooterButtonAndroid } from "@components/footers/FooterButtonAndroid/FooterButtonAndroid";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderTextButton } from "@components/headers/headerSideComponents/HeaderTextButton/HeaderTextButton";
import { ViewingKeyView } from "@components/views/ViewingKeyView/ViewingKeyView";
import { NewWalletStackParamList } from "@models/navigation-models";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import { CalloutType } from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";

export const VIEWING_KEY_INFO_CALLOUT_TEXT =
  "This private viewing key can be used to access your entire transaction history for this 0zk address, across all blockchains. Be careful: once shared, access cannot be revoked.";

interface ViewingKeyCalloutProps {
  route: RouteProp<
    { params: NewWalletStackParamList["ViewingKeyCallout"] },
    "params"
  >;
  navigation: NavigationProp<NewWalletStackParamList, "ViewingKeyCallout">;
}

export const ViewingKeyCalloutScreen: React.FC<ViewingKeyCalloutProps> = ({
  route,
  navigation,
}) => {
  const { wallet, walletCreationType } = route.params;

  const onContinue = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.navigate("NewWalletSuccess", {
      walletCreationType,
      wallet,
    });
  };

  const onViewingKeyFail = () => {};

  return (
    <>
      <AppHeader
        title="Shareable Viewing Key"
        headerRight={<HeaderTextButton text="Next" onPress={onContinue} />}
        isModal={false}
      />
      <InfoCallout
        type={CalloutType.Info}
        text={VIEWING_KEY_INFO_CALLOUT_TEXT}
      />
      <ViewingKeyView wallet={wallet} onViewingKeyFail={onViewingKeyFail} />
      <FooterButtonAndroid buttonAction={onContinue} buttonTitle="Next" />
    </>
  );
};

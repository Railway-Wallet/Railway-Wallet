import { WalletCreationType } from "@railgun-community/shared-models";
import React, { useState } from "react";
import { InfoCallout } from "@components/callouts/InfoCallout/InfoCallout";
import { FooterButtonAndroid } from "@components/footers/FooterButtonAndroid/FooterButtonAndroid";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderTextButton } from "@components/headers/headerSideComponents/HeaderTextButton/HeaderTextButton";
import { SeedPhraseView } from "@components/views/SeedPhraseView/SeedPhraseView";
import { NewWalletStackParamList } from "@models/navigation-models";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import { CalloutType, styleguide } from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";

interface SeedPhraseCalloutScreenProps {
  route: RouteProp<
    { params: NewWalletStackParamList["SeedPhraseCallout"] },
    "params"
  >;
  navigation: NavigationProp<NewWalletStackParamList, "SeedPhraseCallout">;
}

export const SeedPhraseCalloutScreen: React.FC<
  SeedPhraseCalloutScreenProps
> = ({ route, navigation }) => {
  const { wallet } = route.params;
  const [isLoadingMnemonic, setIsLoadingMnemonic] = useState<boolean>(false);

  const onContinue = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.navigate("ViewingKeyCallout", {
      walletCreationType: WalletCreationType.Create,
      wallet,
    });
  };

  return (
    <>
      <AppHeader
        title="Save Seed Phrase"
        headerRight={
          <HeaderTextButton
            disabled={isLoadingMnemonic}
            text="Next"
            onPress={onContinue}
          />
        }
        isModal={false}
      />
      <InfoCallout
        type={CalloutType.Warning}
        text="WARNING: Store your seed phrase in order to recover this wallet. If you delete the app or restore your phone from a backup, your wallet will be deleted."
        ctaButton="View&nbsp;Seed&nbsp;Phrase"
        borderColor={styleguide.colors.danger}
      />
      <SeedPhraseView
        wallet={wallet}
        blurSeedPhrase={true}
        isLoadingMnemonic={isLoadingMnemonic}
        setIsLoadingMnemonic={setIsLoadingMnemonic}
      />
      <FooterButtonAndroid
        disabled={isLoadingMnemonic}
        buttonAction={onContinue}
        buttonTitle="Next"
      />
    </>
  );
};

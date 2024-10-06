import { WalletCreationType } from "@railgun-community/shared-models";
import React from "react";
import { ImageSourcePropType, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FooterButtonAndroid } from "@components/footers/FooterButtonAndroid/FooterButtonAndroid";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderTextButton } from "@components/headers/headerSideComponents/HeaderTextButton/HeaderTextButton";
import { useDisableBackGesture } from "@hooks/navigation/useDisableBackGesture";
import { useDisableHardwareBackButton } from "@hooks/navigation/useDisableHardwareBackButton";
import { NewWalletStackParamList } from "@models/navigation-models";
import {
  CommonActions,
  NavigationProp,
  RouteProp,
} from "@react-navigation/native";
import {
  getSupportedEVMNetworkLogos,
  IconPublic,
  IconShielded,
  ImageRailgunLogo,
  styleguide,
  useAppDispatch,
} from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { NewWalletCard } from "./NewWalletCard/NewWalletCard";
import { styles } from "./styles";

interface NewWalletSuccessProps {
  navigation: NavigationProp<NewWalletStackParamList, "NewWalletSuccess">;
  route: RouteProp<
    { params: NewWalletStackParamList["NewWalletSuccess"] },
    "params"
  >;
}

export const NewWalletSuccess: React.FC<NewWalletSuccessProps> = ({
  route,
  navigation,
}) => {
  const { wallet, walletCreationType } = route.params;
  const dispatch = useAppDispatch();

  useDisableHardwareBackButton();
  useDisableBackGesture(dispatch);

  const onSubmit = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.dispatch(CommonActions.navigate("WalletsScreen"));
  };

  const onTapQrCodeButton = (isRailgun: boolean, walletType: string) => {
    navigation.navigate("ReceiveToken", {
      isRailgun: isRailgun,
      titleOverride: !isRailgun ? walletType : undefined,
    });
  };

  const evmLogos: ImageSourcePropType[] = getSupportedEVMNetworkLogos();

  const title = () => {
    switch (walletCreationType) {
      case WalletCreationType.Create:
        return "Wallet Created";
      case WalletCreationType.Import:
      case WalletCreationType.ImportFromBackup:
        return "Wallet Imported";
      case WalletCreationType.AddViewOnly:
        return "Wallet Added";
    }
  };

  return (
    <View style={styles.wrapper}>
      <AppHeader
        title={title()}
        headerRight={<HeaderTextButton text="Finish" onPress={onSubmit} />}
        isModal={false}
      />
      <SafeAreaView style={styles.wrapper} edges={["left", "right"]}>
        <ScrollView contentContainerStyle={styles.scrollViewContentContainer}>
          <Text style={styles.titleText}>Review wallet details below.</Text>
          <NewWalletCard
            walletType="RAILGUN 0zk"
            headerIcon={IconShielded()}
            logos={[ImageRailgunLogo()]}
            address={wallet.railAddress}
            isViewOnlyWallet={wallet.isViewOnlyWallet}
            onTapQrCodeButton={(walletType) =>
              onTapQrCodeButton(true, walletType)
            }
          />
          {!wallet.isViewOnlyWallet && (
            <NewWalletCard
              walletType="Public EVMs"
              headerIcon={IconPublic()}
              logos={evmLogos}
              address={wallet.ethAddress}
              backgroundColor={styleguide.colors.gray4()}
              onTapQrCodeButton={(walletType) =>
                onTapQrCodeButton(false, walletType)
              }
              style={styles.lastCard}
            />
          )}
        </ScrollView>
      </SafeAreaView>
      <FooterButtonAndroid buttonAction={onSubmit} buttonTitle="Finish" />
    </View>
  );
};

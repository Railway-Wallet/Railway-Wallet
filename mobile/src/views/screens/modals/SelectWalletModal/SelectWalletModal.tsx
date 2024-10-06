import React, { useState } from "react";
import { Modal, ScrollView, View } from "react-native";
import { ButtonWithTextAndIcon } from "@components/buttons/ButtonWithTextAndIcon/ButtonWithTextAndIcon";
import { SafeGrayFooter } from "@components/footers/SafeGrayFooter/SafeGrayFooter";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { useModalInteractionManager } from "@hooks/navigation/useModalInteractionManager";
import {
  CommonActions,
  TabActions,
  useNavigation,
} from "@react-navigation/native";
import { FrontendWallet, styleguide } from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { PublicPrivateSelector } from "../../DApps/Swap/SwapScreen/PublicPrivateSelector/PublicPrivateSelector";
import { SelectWalletList } from "./SelectWalletList/SelectWalletList";
import { styles } from "./styles";

type Props = {
  show: boolean;
  title: string;
  isRailgunInitial: boolean;
  onDismiss: (
    wallet?: FrontendWallet,
    address?: string,
    removeSelectedWallet?: boolean
  ) => void;
  selectedWallet?: FrontendWallet;
  selectedAddress?: string;
  showBroadcasterOption?: boolean;
  showNoDestinationWalletOption?: boolean;
  showCustomAddressDestinationOption?: boolean;
  availableWalletsOnly?: boolean;
  showSavedAddresses?: boolean;
  showPublicPrivateToggle?: boolean;
  closeModal: () => void;
};

export const SelectWalletModal: React.FC<Props> = ({
  show,
  title,
  isRailgunInitial,
  onDismiss,
  selectedWallet,
  selectedAddress,
  showBroadcasterOption,
  showNoDestinationWalletOption,
  showCustomAddressDestinationOption,
  availableWalletsOnly,
  showSavedAddresses,
  showPublicPrivateToggle = false,
  closeModal,
}) => {
  const [isRailgun, setIsRailgun] = useState(isRailgunInitial);

  const navigation = useNavigation();
  const { onModalInteractionDismiss } = useModalInteractionManager(show);

  const handleGoToWalletSettings = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    closeModal();
    navigation.dispatch(TabActions.jumpTo("Settings"));
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: "SettingsScreen" }, { name: "SettingsWallets" }],
      })
    );
  };

  return (
    <Modal
      animationType="slide"
      presentationStyle="formSheet"
      visible={show}
      onRequestClose={() => {
        onDismiss();
      }}
      onDismiss={onModalInteractionDismiss}
    >
      <AppHeader
        title={title}
        headerStatusBarHeight={16}
        backgroundColor={styleguide.colors.gray5()}
        headerLeft={<HeaderBackButton customAction={onDismiss} />}
        headerRight={
          showPublicPrivateToggle ? (
            <PublicPrivateSelector
              isRailgun={isRailgun}
              onTap={() => {
                triggerHaptic(HapticSurface.EditSuccess);
                setIsRailgun(!isRailgun);
              }}
            />
          ) : undefined
        }
        isModal={true}
      />
      <ScrollView style={styles.wrapper}>
        <SelectWalletList
          isRailgun={isRailgun}
          selectedWallet={selectedWallet}
          selectedAddress={selectedAddress}
          onSelect={onDismiss}
          showBroadcasterOption={showBroadcasterOption}
          showNoDestinationWalletOption={showNoDestinationWalletOption}
          showCustomAddressDestinationOption={
            showCustomAddressDestinationOption
          }
          availableWalletsOnly={availableWalletsOnly}
          showSavedAddresses={showSavedAddresses}
        />
      </ScrollView>
      <SafeGrayFooter>
        <View style={styles.footerContent}>
          <ButtonWithTextAndIcon
            icon="cog-outline"
            onPress={handleGoToWalletSettings}
            title="Open wallet settings"
          />
        </View>
      </SafeGrayFooter>
    </Modal>
  );
};

import {
  BroadcasterConnectionStatus,
  SelectedBroadcaster,
} from "@railgun-community/shared-models";
import React, { useMemo } from "react";
import { Modal, SafeAreaView, Text, View } from "react-native";
import {
  ERC20Token,
  getTokenDisplayNameShort,
  sortBroadcasters,
  styleguide,
  useBroadcasterConnectionStatus,
  useReduxSelector,
} from "@react-shared";
import { ButtonTextOnly } from "@views/components/buttons/ButtonTextOnly/ButtonTextOnly";
import { AppHeader } from "@views/components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@views/components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { SelectBroadcasterList } from "./SelectBroadcasterList/SelectBroadcasterList";
import { styles } from "./styles";

type Props = {
  show: boolean;
  onDismiss: () => void;
  onRandomBroadcaster: () => void;
  onSelectBroadcaster: (broadcaster: Optional<SelectedBroadcaster>) => void;
  changeFeeToken: () => void;
  selectedBroadcaster: Optional<SelectedBroadcaster>;
  allBroadcasters: Optional<SelectedBroadcaster[]>;
  feeToken: ERC20Token;
};

export const SelectBroadcasterModal: React.FC<Props> = ({
  show,
  onDismiss,
  onRandomBroadcaster,
  onSelectBroadcaster,
  changeFeeToken,
  selectedBroadcaster,
  allBroadcasters,
  feeToken,
}) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const { broadcasterConnectionStatus, statusText } =
    useBroadcasterConnectionStatus();

  const feeTokenName = useMemo(() => {
    return getTokenDisplayNameShort(
      feeToken,
      wallets.available,
      network.current.name
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeToken.address, network.current.name, wallets.available]);

  const broadcastersNotConnected =
    broadcasterConnectionStatus !== BroadcasterConnectionStatus.Connected;

  const statusTextAddOn = useMemo(() => {
    switch (broadcasterConnectionStatus) {
      case BroadcasterConnectionStatus.Searching:
        return "Please wait...";
      case BroadcasterConnectionStatus.Error:
      case BroadcasterConnectionStatus.Disconnected:
      case BroadcasterConnectionStatus.AllUnavailable:
        return "Please refresh and try again.";
      case BroadcasterConnectionStatus.Connected:
        return "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusText, broadcasterConnectionStatus]);

  const sortedBroadcasters = sortBroadcasters(allBroadcasters);

  return (
    <Modal
      animationType="slide"
      presentationStyle="formSheet"
      visible={show}
      onRequestClose={onDismiss}
    >
      <>
        <AppHeader
          isModal
          title="Select public broadcaster"
          headerStatusBarHeight={16}
          backgroundColor={styleguide.colors.gray5()}
          headerLeft={<HeaderBackButton customAction={onDismiss} />}
        />
        <SafeAreaView style={styles.wrapper}>
          {broadcastersNotConnected ? (
            <Text style={styles.placeholder}>
              {statusText}. {statusTextAddOn}
            </Text>
          ) : (
            <>
              <SelectBroadcasterList
                selectedBroadcaster={selectedBroadcaster}
                allBroadcasters={sortedBroadcasters}
                onSelect={onSelectBroadcaster}
                onSelectRandom={onRandomBroadcaster}
                decimals={feeToken.decimals}
                feeTokenName={feeTokenName}
              />
              <View style={styles.footer}>
                <Text style={styles.footerText}>Fee token: {feeTokenName}</Text>
                <ButtonTextOnly
                  title="Change fee token"
                  onTap={changeFeeToken}
                />
              </View>
            </>
          )}
        </SafeAreaView>
      </>
    </Modal>
  );
};

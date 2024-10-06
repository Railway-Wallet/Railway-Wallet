import { isDefined } from "@railgun-community/shared-models";
import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { QRCodeCardView } from "@components/views/QRCodeCardView/QRCodeCardView";
import { TokenStackParamList } from "@models/navigation-models";
import Clipboard from "@react-native-clipboard/clipboard";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import {
  CalloutType,
  getNetworkFrontendConfig,
  showImmediateToast,
  ToastType,
  useAppDispatch,
  useReduxSelector,
} from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { shareMessage } from "@services/util/share-service";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<TokenStackParamList, "ReceiveToken">;
  route: RouteProp<{ params: TokenStackParamList["ReceiveToken"] }, "params">;
};

export const ReceiveTokenScreen: React.FC<Props> = ({ route }) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const { isRailgun, titleOverride } = route.params;
  const [loadingText, setLoadingText] = useState("");
  const [address, setAddress] = useState<Optional<string>>();
  const dispatch = useAppDispatch();

  const activeWallet = wallets.active;

  useEffect(() => {
    const loadWalletAddress = async () => {
      setLoadingText("Loading wallet address...");
      if (!activeWallet) {
        setLoadingText("No wallet loaded.");
        return;
      }
      if (isRailgun) {
        const railgunAddress = activeWallet.railAddress;
        setAddress(railgunAddress);
        return;
      }
      if (activeWallet.isViewOnlyWallet) {
        setLoadingText("View-only wallet cannot receive public funds.");
        return;
      }
      setAddress(activeWallet.ethAddress);
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadWalletAddress();
  }, [activeWallet, isRailgun, network]);

  const railOrNetworkName = isRailgun
    ? "RAILGUN 0zk"
    : network.current.publicName;
  const infoCalloutText = isRailgun
    ? `RAILGUN private 0zk addresses are generated from your wallet's public keys. The following address can send and receive shielded assets.`
    : `Send only public ${network.current.publicName} assets to this address.`;

  const onShare = async () => {
    if (!isDefined(address)) {
      return;
    }
    triggerHaptic(HapticSurface.ClipboardCopy);
    await shareMessage(address);
  };

  const onCopy = () => {
    if (!isDefined(address)) {
      return;
    }
    triggerHaptic(HapticSurface.ClipboardCopy);
    Clipboard.setString(address);
    dispatch(
      showImmediateToast({
        message: `${railOrNetworkName} address copied. Paste elsewhere to share.`,
        type: ToastType.Copy,
      })
    );
  };

  const frontendConfig = getNetworkFrontendConfig(network.current.name);

  return (
    <>
      <AppHeader
        title="Receive"
        headerLeft={<HeaderBackButton />}
        isModal={false}
      />
      <SafeAreaView style={styles.container} edges={["right", "left"]}>
        <ScrollView>
          <QRCodeCardView
            title={titleOverride ?? railOrNetworkName}
            infoCalloutText={infoCalloutText}
            infoCalloutType={CalloutType.Info}
            addressOrMnemonic={address ?? loadingText}
            infoCalloutBorderColor={
              isRailgun ? undefined : frontendConfig.backgroundColor
            }
            infoCalloutGradientColors={
              isRailgun ? undefined : frontendConfig.gradientColors
            }
            onCopy={onCopy}
            onShare={onShare}
          />
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

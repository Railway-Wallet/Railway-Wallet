import { isDefined } from "@railgun-community/shared-models";
import React, { useState } from "react";
import { View } from "react-native";
import { JsonRpcProvider } from "ethers";
import { FooterButtonAndroid } from "@components/footers/FooterButtonAndroid/FooterButtonAndroid";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { HeaderTextButton } from "@components/headers/headerSideComponents/HeaderTextButton/HeaderTextButton";
import { TextEntry } from "@components/inputs/TextEntry/TextEntry";
import { FullScreenSpinner } from "@components/loading/FullScreenSpinner/FullScreenSpinner";
import { SettingsStackParamList } from "@models/navigation-models";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import { logDevError, promiseTimeout } from "@react-shared";
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from "@screens/modals/ErrorDetailsModal/ErrorDetailsModal";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<SettingsStackParamList, "SettingsAddRPC">;
  route: RouteProp<
    { params: SettingsStackParamList["SettingsAddRPC"] },
    "params"
  >;
};

export const SettingsAddCustomRPCScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { network } = route.params;
  const [hasValidEntries, setHasValidEntries] = useState(false);
  const [rpcUrl, setRpcUrl] = useState("");
  const [showLoading, setShowLoading] = useState(false);
  const [errorModal, setErrorModal] =
    useState<Optional<ErrorDetailsModalProps>>(undefined);

  const onSubmit = async () => {
    if (!hasValidEntries) {
      return;
    }

    triggerHaptic(HapticSurface.NavigationButton);
    setShowLoading(true);

    try {
      const provider = new JsonRpcProvider(rpcUrl, network.chain.id);
      await promiseTimeout(provider.getBlock("latest"), 5000);
      setShowLoading(false);
      navigation.navigate("SettingsNetworkInfo", {
        network,
        newRpcUrl: rpcUrl,
      });
    } catch (cause) {
      setShowLoading(false);
      if (!(cause instanceof Error)) {
        throw new Error("Unexpected non-error thrown", { cause });
      }
      let message = "Please verify the URL for this provider.";
      if (cause.message.includes("underlying network changed")) {
        message = `This provider is not compatible with ${network.publicName}.`;
      }
      const error = new Error("Error connecting to RPC. " + message, { cause });
      logDevError(error);
      setErrorModal({
        show: true,
        error,
        onDismiss: () => setErrorModal(undefined),
      });
    }
  };

  const validateURLRegex = (str: string) => {
    var pattern = new RegExp(
      "^((https|wss)?:\\/\\/)?" +
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" +
        "((\\d{1,3}\\.){3}\\d{1,3}))" +
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
        "(\\?[;&a-z\\d%_.~+=-]*)?" +
        "(\\#[-a-z\\d_]*)?$",
      "i"
    );
    return !!pattern.test(str);
  };

  const validateEntries = (url: string) => {
    setHasValidEntries(validateURLRegex(url));
  };

  const updateRpc = (value: string) => {
    setRpcUrl(value);
    validateEntries(value);
  };

  return (
    <>
      <AppHeader
        title="Add Custom RPC"
        isModal={false}
        headerLeft={<HeaderBackButton />}
        headerRight={
          <HeaderTextButton
            text="Add"
            onPress={onSubmit}
            disabled={!hasValidEntries}
          />
        }
      />
      <View style={styles.wrapper}>
        <View style={styles.inputsWrapper}>
          <TextEntry
            viewStyles={[
              styles.rpcInput,
              rpcUrl && rpcUrl !== "" && !hasValidEntries
                ? styles.rpcInputError
                : undefined,
            ]}
            label="RPC Url"
            value={rpcUrl}
            onChangeText={updateRpc}
            placeholder="https://my.custom.rpc"
            autoFocus
            autoCapitalize="none"
          />
        </View>
      </View>
      <FooterButtonAndroid
        buttonAction={onSubmit}
        buttonTitle="Create"
        disabled={!hasValidEntries}
      />
      <FullScreenSpinner show={showLoading} text="Verifying..." />
      {isDefined(errorModal) && <ErrorDetailsModal {...errorModal} />}
    </>
  );
};

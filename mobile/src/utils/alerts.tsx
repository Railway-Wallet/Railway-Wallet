import { isDefined } from "@railgun-community/shared-models";
import React from "react";
import { Alert, View } from "react-native";
import RNRestart from "react-native-restart";
import { AlertProps } from "@components/alerts/GenericAlert/GenericAlert";
import { ButtonTextOnly } from "@components/buttons/ButtonTextOnly/ButtonTextOnly";
import {
  AppDispatch,
  AppSettingsService,
  Currency,
  POIDocumentation,
} from "@react-shared";
import { openExternalLinkAlert } from "@services/util/alert-service";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { styles } from "./utilsStyles";

export const createUpdateSettingsAlert = (currency: Currency) => {
  Alert.alert(
    "Settings updated",
    "Railway will now restart to apply this setting.",
    [
      {
        text: "Ok",
        onPress: async () => {
          await AppSettingsService.setCurrency(currency);
          triggerHaptic(HapticSurface.EditSuccess);
          RNRestart.restart();
        },
      },
      {
        text: "Cancel",
        style: "destructive",
      },
    ]
  );
};

export const createPOIDisclaimerAlert = (
  title: string,
  message: string,
  setAlert: React.Dispatch<React.SetStateAction<AlertProps | undefined>>,
  dispatch: AppDispatch,
  poiDocumentation?: POIDocumentation,
  customOnSubmit?: () => void,
  customSubmitTitle?: string
) => {
  const handleRedirect = (url: string) => () => {
    openExternalLinkAlert(url, dispatch);
  };

  setAlert({
    show: true,
    title,
    message,
    submitTitle: customSubmitTitle ?? "I understand",
    footerView: isDefined(poiDocumentation) ? (
      <View style={styles.footerView}>
        <ButtonTextOnly
          title="About RAILGUN's Private POI system"
          onTap={handleRedirect(poiDocumentation.railgunPOIDocUrl)}
          labelStyle={styles.submitButtonText}
        />
        <ButtonTextOnly
          title="Private POI in Railway Wallet"
          onTap={handleRedirect(poiDocumentation.railwayPOIDocUrl)}
          labelStyle={styles.submitButtonText}
        />
      </View>
    ) : undefined,
    onSubmit: () => {
      setAlert(undefined);
      customOnSubmit?.();
    },
  });
};

export const createSelfBroadcastDisclaimerAlert = (
  setAlert: React.Dispatch<React.SetStateAction<AlertProps | undefined>>,
  dispatch: AppDispatch
) => {
  const handleRedirect = (url: string) => () => {
    openExternalLinkAlert(url, dispatch);
  };

  setAlert({
    show: true,
    title: "Self Broadcast",
    message:
      "Use a wallet you control to sign a private transaction and and broadcast to the blockchain nodes. This wallet will pay gas fees from its public balance. Be sure to follow best practices when self broadcasting to maintain anonymity.",
    submitTitle: "Okay",
    footerView: (
      <View style={styles.footerView}>
        <ButtonTextOnly
          title="Learn more"
          onTap={handleRedirect(
            "https://help.railway.xyz/transactions/self-signing"
          )}
          labelStyle={styles.submitButtonText}
        />
      </View>
    ),
    onSubmit: () => {
      setAlert(undefined);
    },
  });
};

export const createPublicBroadcasterDisclaimerAlert = (
  setAlert: React.Dispatch<React.SetStateAction<AlertProps | undefined>>,
  dispatch: AppDispatch
) => {
  const handleRedirect = (url: string) => () => {
    openExternalLinkAlert(url, dispatch);
  };

  setAlert({
    show: true,
    title: "Public Broadcaster",
    message:
      "Use a third-party public broadcaster to sign a private transaction and broadcast to the blockchain nodes. This provides more anonymity. Public broadcasters do not ever gain control or custody of your funds and cannot see any details of the sender or the contents of the private transaction. Railway does not control or maintain any broadcasters in the decentralized public broadcaster network.",
    submitTitle: "Okay",
    footerView: (
      <View style={styles.footerView}>
        <ButtonTextOnly
          title="Learn more"
          onTap={handleRedirect(
            "https://docs.railgun.org/wiki/learn/privacy-system/community-broadcasters"
          )}
          labelStyle={styles.submitButtonText}
        />
      </View>
    ),
    onSubmit: () => {
      setAlert(undefined);
    },
  });
};

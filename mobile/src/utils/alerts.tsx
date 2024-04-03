import { isDefined } from '@railgun-community/shared-models';
import React from 'react';
import { Alert, View } from 'react-native';
import RNRestart from 'react-native-restart';
import { AlertProps } from '@components/alerts/GenericAlert/GenericAlert';
import { ButtonTextOnly } from '@components/buttons/ButtonTextOnly/ButtonTextOnly';
import {
  AppDispatch,
  AppSettingsService,
  Currency,
  POIDocumentation,
} from '@react-shared';
import { openExternalLinkAlert } from '@services/util/alert-service';
import { HapticSurface, triggerHaptic } from '@services/util/haptic-service';
import { styles } from './utilsStyles';

export const createUpdateSettingsAlert = (currency: Currency) => {
  Alert.alert(
    'Settings updated',
    'Railway will now restart to apply this setting.',
    [
      {
        text: 'Ok',
        onPress: async () => {
          await AppSettingsService.setCurrency(currency);
          triggerHaptic(HapticSurface.EditSuccess);
          RNRestart.restart();
        },
      },
      {
        text: 'Cancel',
        style: 'destructive',
      },
    ],
  );
};

export const createPOIDisclaimerAlert = (
  title: string,
  message: string,
  setAlert: React.Dispatch<React.SetStateAction<AlertProps | undefined>>,
  dispatch: AppDispatch,
  poiDocumentation?: POIDocumentation,
  customOnSubmit?: () => void,
  customSubmitTitle?: string,
) => {
  const handleRedirect = (url: string) => () => {
    openExternalLinkAlert(url, dispatch);
  };

  setAlert({
    show: true,
    title,
    message,
    submitTitle: customSubmitTitle ?? 'I understand',
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

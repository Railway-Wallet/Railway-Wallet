import { isDefined } from '@railgun-community/shared-models';
import { NativeModules, Platform } from 'react-native';
import * as RNLocalize from 'react-native-localize';
import { logDevError } from '@react-shared';

export const getCurrentLocaleMobile = (): string => {
  try {
    const locales = RNLocalize.getLocales();
    if (isDefined(locales) && locales.length > 0) {
      const primaryLocale = locales[0];
      return `${primaryLocale.languageCode}-${primaryLocale.countryCode}`;
    }

    if (Platform.OS === 'ios') {
      return String(
        NativeModules.SettingsManager.settings.AppleLocale ??
          NativeModules.SettingsManager.settings.AppleLanguages[0],
      ).replace(/_/g, '-');
    }

    if (Platform.OS === 'android') {
      return String(NativeModules.I18nManager.localeIdentifier).replace(
        /_/g,
        '-',
      );
    }

    return 'en-US';
  } catch (cause) {
    const error = new Error('Error getting locale', { cause });
    logDevError(error);
    return 'en-US';
  }
};

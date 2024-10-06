import { isDefined, TXIDVersion } from "@railgun-community/shared-models";
import { SharedConstants } from "../../config/shared-constants";
import {
  Currency,
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
} from "../../models/currency";
import { setTXIDVersion } from "../../redux-store/reducers/txid-version-reducer";
import { AppDispatch } from "../../redux-store/store";
import { getSupportedCurrency } from "../../utils/currencies";
import { StorageService } from "../storage/storage-service";

export const DEFAULT_LOCALE = "en-US";

export class AppSettingsService {
  static currency: Currency = DEFAULT_CURRENCY;
  static locale: string = DEFAULT_LOCALE;

  static async setTXIDVersion(dispatch: AppDispatch, txidVersion: TXIDVersion) {
    dispatch(setTXIDVersion(txidVersion));
    await StorageService.setItem(
      SharedConstants.APP_SETTINGS_TXID_VERSION,
      txidVersion
    );
  }

  static async setCurrency(currency: Currency) {
    const supportedCurrency = getSupportedCurrency(currency);
    this.currency = supportedCurrency;
    await StorageService.setItem(
      SharedConstants.APP_SETTINGS_CURRENCY_CODE,
      currency.code
    );
  }

  static async setLocale(locale: string) {
    this.locale = locale;
    await StorageService.setItem(SharedConstants.APP_SETTINGS_LOCALE, locale);
  }

  static async loadSettingsFromStorage(dispatch: AppDispatch): Promise<void> {
    const locale = await StorageService.getItem(
      SharedConstants.APP_SETTINGS_LOCALE
    );
    if (isDefined(locale)) {
      this.locale = locale;
    }

    const currencyCode = await StorageService.getItem(
      SharedConstants.APP_SETTINGS_CURRENCY_CODE
    );
    if (isDefined(currencyCode)) {
      for (const currency of Object.values(SUPPORTED_CURRENCIES)) {
        if (currency.code === currencyCode) {
          this.currency = currency;
          break;
        }
      }
    }

    const storedTXIDVersion =
      ((await StorageService.getItem(
        SharedConstants.APP_SETTINGS_TXID_VERSION
      )) as TXIDVersion) ?? TXIDVersion.V2_PoseidonMerkle;
    if (isDefined(storedTXIDVersion)) {
      await AppSettingsService.setTXIDVersion(dispatch, storedTXIDVersion);
    }
  }
}

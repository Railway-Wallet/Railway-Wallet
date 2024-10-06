import {
  AppDispatch,
  DEFAULT_CURRENCY,
  NetworkService,
  ProviderLoader,
  setAuthKey,
  StorageService,
  WalletService,
} from "@react-shared";
import { createUpdateSettingsAlert } from "@utils/alerts";
import { Constants } from "@utils/constants";
import { WalletSecureServiceReactNative } from "../wallet/wallet-secure-service-react-native";
import { resetPin } from "./secure-app-service";

export const wipeDevice_DESTRUCTIVE = async (dispatch: AppDispatch) => {
  const walletService = new WalletService(
    dispatch,
    new WalletSecureServiceReactNative()
  );
  await walletService.clearAllWallets();

  await StorageService.removeItem(Constants.NUM_REMINDERS_SET_PIN);

  const defaultNetworkName = NetworkService.getDefaultNetworkName();
  const feesSerialized = await ProviderLoader.loadEngineProvider(
    defaultNetworkName,
    dispatch
  );

  const networkService = new NetworkService(dispatch);
  await networkService.selectNetwork(defaultNetworkName, feesSerialized);

  await resetPin();
  dispatch(setAuthKey(Constants.DEFAULT_AUTH_KEY));

  createUpdateSettingsAlert(DEFAULT_CURRENCY);
};

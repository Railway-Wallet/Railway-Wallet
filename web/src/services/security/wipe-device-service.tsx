import {
  AppDispatch,
  DEFAULT_CURRENCY,
  getSupportedNetworks,
  NetworkService,
  ProviderLoader,
  WalletService,
} from '@react-shared';
import { createUpdateCurrencyAlert } from '@utils/alerts';
import { AlertProps } from '@views/components/alerts/GenericAlert/GenericAlert';
import { WalletSecureStorageWeb } from '../wallet/wallet-secure-service-web';
import { removePassword } from './password-service';

export const wipeDevice_DESTRUCTIVE = async (
  dispatch: AppDispatch,
  setAlert: React.Dispatch<React.SetStateAction<AlertProps | undefined>>,
) => {
  const walletService = new WalletService(
    dispatch,
    new WalletSecureStorageWeb(''),
  );
  await walletService.clearAllWallets();

  const defaultNetwork = getSupportedNetworks()[0];
  const networkService = new NetworkService(dispatch);

  const feesSerialized = await ProviderLoader.loadEngineProvider(
    defaultNetwork.name,
    dispatch,
  );
  await networkService.selectNetwork(defaultNetwork.name, feesSerialized);

  await removePassword();

  createUpdateCurrencyAlert(DEFAULT_CURRENCY, setAlert);
};

import { isDefined } from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';
import { Button } from '@components/Button/Button';
import { InfoCallout } from '@components/InfoCallout/InfoCallout';
import { Text } from '@components/Text/Text';
import {
  CalloutType,
  getNetworkFrontendConfig,
  getRailgunAddress,
  showImmediateToast,
  ToastType,
  useAppDispatch,
  useReduxSelector,
} from '@react-shared';
import { IconType } from '@services/util/icon-service';
import {
  createRailgunQrCode,
  fadedQrCodePlaceholder,
} from '@services/util/qr-code-service';
import { copyToClipboard } from '@utils/clipboard';
import styles from './ReceiveTokens.module.scss';

type Props = {
  isRailgun: boolean;
  titleOverride?: string;
};

export const ReceiveTokens: React.FC<Props> = ({
  isRailgun,
  titleOverride,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const [addressText, setAddressText] = useState('');
  const [loadedAddress, setLoadedAddress] = useState<Optional<string>>();
  const dispatch = useAppDispatch();

  const activeWallet = wallets.active;

  useEffect(() => {
    const loadWalletAddress = async () => {
      setAddressText('Loading wallet address...');
      if (!activeWallet) {
        setAddressText('No wallet loaded.');
        return;
      }
      if (isRailgun) {
        const railAddress = await getRailgunAddress(activeWallet.railWalletID);
        setLoadedAddress(railAddress);
        setAddressText(railAddress ?? 'Could not load address.');
        return;
      }
      if (activeWallet.isViewOnlyWallet) {
        setAddressText('View-only wallet cannot receive public funds.');
        return;
      }
      setLoadedAddress(activeWallet.ethAddress);
      setAddressText(activeWallet.ethAddress);
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadWalletAddress();
  }, [activeWallet, isRailgun, network]);

  const railOrNetworkName = isRailgun ? 'RAILGUN' : network.current.publicName;
  const infoCalloutText = isRailgun
    ? `RAILGUN private 0zk addresses are generated from your wallet's public keys. The following address can  send and receive shielded assets.`
    : `Send only public ${network.current.publicName} assets to this address.`;

  const onCopy = async () => {
    if (!isDefined(loadedAddress)) {
      return;
    }
    await copyToClipboard(loadedAddress);
    dispatch(
      showImmediateToast({
        message: `${railOrNetworkName} address copied. Paste elsewhere to share.`,
        type: ToastType.Copy,
      }),
    );
  };

  const frontendConfig = getNetworkFrontendConfig(network.current.name);

  return (
    <div className={styles.receiveTokensContainer}>
      <div>
        <div>
          <InfoCallout
            type={CalloutType.Info}
            text={infoCalloutText}
            borderColor={isRailgun ? undefined : frontendConfig.backgroundColor}
            gradientColors={
              isRailgun ? undefined : frontendConfig.gradientColors
            }
          />
        </div>
        <div className={styles.cardContent}>
          <Text className={styles.titleText}>
            {titleOverride ?? railOrNetworkName}
          </Text>
          <div className={styles.qrCodeWrapper}>
            {isDefined(loadedAddress) && createRailgunQrCode(loadedAddress)}
            {!isDefined(loadedAddress) && fadedQrCodePlaceholder()}
          </div>
          <div className={styles.addressContainer}>
            <Text className={styles.addressText}>{addressText}</Text>
          </div>
          <div className={styles.copyButtonContainer}>
            <Button
              endIcon={IconType.Copy}
              buttonClassName={styles.copyButton}
              onClick={onCopy}
            >
              {`Copy ${railOrNetworkName} address`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

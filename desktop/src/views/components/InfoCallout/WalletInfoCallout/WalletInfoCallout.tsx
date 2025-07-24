import {
  isDefined,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { type FC, useEffect, useState } from 'react';
import { InfoCallout } from '@components/InfoCallout/InfoCallout';
import {
  CalloutType,
  logDev,
  RemoteConfig,
  useAppDispatch,
  useWalletCallout,
} from '@react-shared';
import { RemoteConfigService } from '@services/remote-config/remote-config-service';
import styles from './WalletInfoCallout.module.scss';

type Props = {
  balanceBucketFilter: RailgunWalletBalanceBucket[];
};

export const WalletInfoCallout: FC<Props> = ({ balanceBucketFilter }) => {
  const [remoteConfig, setRemoteConfig] = useState<Optional<RemoteConfig>>();

  const dispatch = useAppDispatch();
  const { text, calloutType: type } = useWalletCallout(balanceBucketFilter);

  useEffect(() => {
    const fetchRemoteConfig = async () => {
      const remoteConfigService = new RemoteConfigService(dispatch);
      try {
        const config = await remoteConfigService.getRemoteConfig();
        setRemoteConfig(config);
      } catch (error) {
        logDev('Failed to fetch remote config:', error);
      }
    };

    void fetchRemoteConfig();
  }, [dispatch]);

  if (!isDefined(text) || !isDefined(type) || !isDefined(remoteConfig)) {
    return null;
  }

  const calloutText =
    remoteConfig.callout.message !== '' ? remoteConfig.callout.message : text;
  const calloutType =
    remoteConfig.callout.type !== ''
      ? (remoteConfig.callout.type as CalloutType)
      : type;

  return (
    <InfoCallout
      text={calloutText}
      type={calloutType}
      className={styles.infoCallout}
    />
  );
};

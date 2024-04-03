import { RelayerConnectionStatus } from '@railgun-community/shared-models';
import React, { useState } from 'react';
import cn from 'classnames';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { Text } from '@components/Text/Text';
import {
  tryReconnectWakuRelayerClient,
  useRelayerConnectionStatus,
} from '@react-shared';
import styles from './RelayerStatusPanelIndicator.module.scss';

type Props = {};

export const RelayerStatusPanelIndicator: React.FC<Props> = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [alert, setAlert] = useState<Optional<AlertProps>>(undefined);

  const { relayerConnectionStatus, indicatorColor, statusText } =
    useRelayerConnectionStatus();

  const isDisconnected =
    relayerConnectionStatus === RelayerConnectionStatus.Disconnected ||
    relayerConnectionStatus === RelayerConnectionStatus.Error;

  const showReconnectionModal = () => {
    if (!isDisconnected) {
      return;
    }
    setAlert({
      title: 'No public relayers found',
      message: `Try to re-establish connection to public relayers?`,
      submitTitle: 'Reconnect',
      onSubmit: async () => {
        setAlert(undefined);
        await tryReconnectWakuRelayerClient();
      },
      onClose: () => setAlert(undefined),
    });
  };

  return (
    <>
      {alert && <GenericAlert {...alert} />}
      <div className={styles.relayerStatusPanelIndicatorContainer}>
        <div
          className={cn(styles.textContainer, {
            [styles.clickable]: isDisconnected,
          })}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={showReconnectionModal}
        >
          <div
            className={styles.statusIndicator}
            style={{ backgroundColor: indicatorColor }}
          />
          <Text
            className={cn(styles.text, {
              [styles.hovered]: isDisconnected && isHovered,
            })}
          >
            {statusText}
          </Text>
        </div>
      </div>
    </>
  );
};

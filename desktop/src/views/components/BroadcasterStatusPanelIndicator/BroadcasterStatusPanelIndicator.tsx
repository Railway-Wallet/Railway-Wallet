import { BroadcasterConnectionStatus } from '@railgun-community/shared-models';
import React, { useState } from 'react';
import cn from 'classnames';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { Text } from '@components/Text/Text';
import {
  tryReconnectWakuBroadcasterClient,
  useBroadcasterConnectionStatus,
} from '@react-shared';
import styles from './BroadcasterStatusPanelIndicator.module.scss';

type Props = {
  isSmallView: boolean;
};

export const BroadcasterStatusPanelIndicator: React.FC<Props> = ({
  isSmallView = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [alert, setAlert] = useState<Optional<AlertProps>>(undefined);

  const { broadcasterConnectionStatus, indicatorColor, statusText } =
    useBroadcasterConnectionStatus();

  const isDisconnected =
    broadcasterConnectionStatus === BroadcasterConnectionStatus.Disconnected ||
    broadcasterConnectionStatus === BroadcasterConnectionStatus.Error;

  const showReconnectionModal = () => {
    if (!isDisconnected) {
      return;
    }
    setAlert({
      title: 'No public broadcasters found',
      message: `Try to re-establish connection to public broadcasters?`,
      submitTitle: 'Reconnect',
      onSubmit: async () => {
        setAlert(undefined);
        await tryReconnectWakuBroadcasterClient();
      },
      onClose: () => setAlert(undefined),
    });
  };

  return (
    <>
      {alert && <GenericAlert {...alert} />}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={showReconnectionModal}
        className={cn(styles.broadcasterStatusPanelIndicatorContainer, {
          [styles.clickable]: isDisconnected,
          [styles.broadcasterStatusPanelIndicatorContainerSmall]: isSmallView,
        })}
      >
        <div className={styles.textContainer}>
          <div
            className={cn(styles.statusIndicator, {
              [styles.smallStatusIndicator]: isSmallView,
            })}
            style={{ backgroundColor: indicatorColor }}
          />
          {!isSmallView && (
            <Text
              className={cn(styles.text, {
                [styles.hovered]: isDisconnected && isHovered,
              })}
            >
              {statusText}
            </Text>
          )}
        </div>
      </div>
    </>
  );
};

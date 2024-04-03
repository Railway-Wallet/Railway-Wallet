import {
  RelayerConnectionStatus,
  SelectedRelayer,
} from '@railgun-community/shared-models';
import React, { useMemo } from 'react';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import { TextButton } from '@components/TextButton/TextButton';
import {
  ERC20Token,
  getTokenDisplayNameShort,
  useReduxSelector,
  useRelayerConnectionStatus,
} from '@react-shared';
import { SelectRelayerList } from './SelectRelayerList/SelectRelayerList';
import styles from './SelectRelayerModal.module.scss';

type Props = {
  onDismiss: () => void;
  onRandomRelayer: () => void;
  onSelectRelayer: (relayer: Optional<SelectedRelayer>) => void;
  changeFeeToken: () => void;
  selectedRelayer: Optional<SelectedRelayer>;
  allRelayers: Optional<SelectedRelayer[]>;
  feeToken: ERC20Token;
};

export const SelectRelayerModal: React.FC<Props> = ({
  onDismiss,
  onRandomRelayer,
  onSelectRelayer,
  changeFeeToken,
  selectedRelayer,
  allRelayers,
  feeToken,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const { relayerConnectionStatus, statusText } = useRelayerConnectionStatus();

  const feeTokenName = useMemo(() => {
    return getTokenDisplayNameShort(
      feeToken,
      wallets.available,
      network.current.name,
    );
  }, [feeToken.address, network.current.name, wallets.available]);

  const relayersNotConnected =
    relayerConnectionStatus !== RelayerConnectionStatus.Connected;

  const statusTextAddOn = useMemo(() => {
    switch (relayerConnectionStatus) {
      case RelayerConnectionStatus.Searching:
        return 'Please wait...';
      case RelayerConnectionStatus.Error:
      case RelayerConnectionStatus.Disconnected:
      case RelayerConnectionStatus.AllUnavailable:
        return 'Please refresh and try again.';
      case RelayerConnectionStatus.Connected:
        return '';
    }
  }, [statusText, relayerConnectionStatus]);

  return (
    <>
      <GenericModal onClose={() => onDismiss()} title={'Select public relayer'}>
        <div className={styles.wrapper}>
          {relayersNotConnected && (
            <Text className={styles.placeholder}>
              {statusText}. {statusTextAddOn}
            </Text>
          )}
          {!relayersNotConnected && (
            <>
              <SelectRelayerList
                selectedRelayer={selectedRelayer}
                allRelayers={allRelayers}
                onSelect={onSelectRelayer}
                onSelectRandom={onRandomRelayer}
                decimals={feeToken.decimals}
                feeTokenName={feeTokenName}
              />
              <div className={styles.footer}>
                <div className={styles.footerContent}>
                  <Text className={styles.footerText}>
                    Fee token: {feeTokenName}
                  </Text>
                  <div className={styles.footerTextButtonWrapper}>
                    <TextButton
                      textClassName={styles.footerTextButton}
                      text="Change fee token"
                      action={changeFeeToken}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </GenericModal>
    </>
  );
};

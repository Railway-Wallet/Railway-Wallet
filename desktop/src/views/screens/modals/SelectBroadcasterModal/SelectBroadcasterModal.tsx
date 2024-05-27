import {
  BroadcasterConnectionStatus,
  SelectedBroadcaster,
} from '@railgun-community/shared-models';
import React, { useMemo } from 'react';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import { TextButton } from '@components/TextButton/TextButton';
import {
  ERC20Token,
  getTokenDisplayNameShort,
  useBroadcasterConnectionStatus,
  useReduxSelector,
} from '@react-shared';
import { SelectBroadcasterList } from './SelectBroadcasterList/SelectBroadcasterList';
import styles from './SelectBroadcasterModal.module.scss';

type Props = {
  onDismiss: () => void;
  onRandomBroadcaster: () => void;
  onSelectBroadcaster: (broadcaster: Optional<SelectedBroadcaster>) => void;
  changeFeeToken: () => void;
  selectedBroadcaster: Optional<SelectedBroadcaster>;
  allBroadcasters: Optional<SelectedBroadcaster[]>;
  feeToken: ERC20Token;
};

export const SelectBroadcasterModal: React.FC<Props> = ({
  onDismiss,
  onRandomBroadcaster,
  onSelectBroadcaster,
  changeFeeToken,
  selectedBroadcaster,
  allBroadcasters,
  feeToken,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const { broadcasterConnectionStatus, statusText } =
    useBroadcasterConnectionStatus();

  const feeTokenName = useMemo(() => {
    return getTokenDisplayNameShort(
      feeToken,
      wallets.available,
      network.current.name,
    );
  }, [feeToken.address, network.current.name, wallets.available]);

  const broadcastersNotConnected =
    broadcasterConnectionStatus !== BroadcasterConnectionStatus.Connected;

  const statusTextAddOn = useMemo(() => {
    switch (broadcasterConnectionStatus) {
      case BroadcasterConnectionStatus.Searching:
        return 'Please wait...';
      case BroadcasterConnectionStatus.Error:
      case BroadcasterConnectionStatus.Disconnected:
      case BroadcasterConnectionStatus.AllUnavailable:
        return 'Please refresh and try again.';
      case BroadcasterConnectionStatus.Connected:
        return '';
    }
  }, [statusText, broadcasterConnectionStatus]);

  return (
    <>
      <GenericModal
        onClose={() => onDismiss()}
        title={'Select public broadcaster'}
      >
        <div className={styles.wrapper}>
          {broadcastersNotConnected && (
            <Text className={styles.placeholder}>
              {statusText}. {statusTextAddOn}
            </Text>
          )}
          {!broadcastersNotConnected && (
            <>
              <SelectBroadcasterList
                selectedBroadcaster={selectedBroadcaster}
                allBroadcasters={allBroadcasters}
                onSelect={onSelectBroadcaster}
                onSelectRandom={onRandomBroadcaster}
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

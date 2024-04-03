import React, { useState } from 'react';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import { TextButton } from '@components/TextButton/TextButton';
import {
  BlockedRelayerService,
  shortenWalletAddress,
  useAppDispatch,
  useReduxSelector,
} from '@react-shared';
import styles from '../SettingsWalletInfoModal/SettingsWalletInfoModal.module.scss';

type Props = {
  onClose: (closeAllModals: boolean) => void;
};

export const SettingsRelayersModal: React.FC<Props> = ({ onClose }) => {
  const { relayerBlocklist } = useReduxSelector('relayerBlocklist');

  const dispatch = useAppDispatch();

  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);

  const promptUnblockRelayer = (pubKey: string) => {
    setAlert({
      title: 'Unblock relayer?',
      message: `Address: ${pubKey}.`,
      onClose: () => setAlert(undefined),
      onSubmit: async () => {
        setAlert(undefined);
        const blockedRelayerService = new BlockedRelayerService(dispatch);
        await blockedRelayerService.removeBlockedRelayer(pubKey);
      },
      submitTitle: 'Unblock',
    });
  };

  return (
    <>
      <GenericModal
        onClose={() => onClose(false)}
        title="Public Relayer Settings"
      >
        <div className={styles.settingsRelayersModalContainer}>
          <div className={styles.itemInnerContainer}>
            <div className={styles.flexContainer}>
              <Text className={styles.subheader}>Blocked Relayers</Text>
            </div>
          </div>
          {!relayerBlocklist.relayers.length && (
            <Text className={styles.label}>No blocked Relayers.</Text>
          )}
          {relayerBlocklist.relayers.map((blockedRelayer, index) => (
            <>
              <div className={styles.spacer} />
              <TextButton
                key={index}
                text={shortenWalletAddress(blockedRelayer.railgunAddress)}
                textClassName={styles.label}
                action={() =>
                  promptUnblockRelayer(blockedRelayer.railgunAddress)
                }
              />
            </>
          ))}
        </div>
      </GenericModal>
      {alert && <GenericAlert {...alert} />}
    </>
  );
};

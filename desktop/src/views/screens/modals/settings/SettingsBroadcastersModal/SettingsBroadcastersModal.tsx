import React, { useState } from 'react';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import { TextButton } from '@components/TextButton/TextButton';
import {
  BlockedBroadcasterService,
  shortenWalletAddress,
  useAppDispatch,
  useReduxSelector,
} from '@react-shared';
import styles from '../SettingsWalletInfoModal/SettingsWalletInfoModal.module.scss';

type Props = {
  onClose: (closeAllModals: boolean) => void;
};

export const SettingsBroadcastersModal: React.FC<Props> = ({ onClose }) => {
  const { broadcasterBlocklist } = useReduxSelector('broadcasterBlocklist');

  const dispatch = useAppDispatch();

  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);

  const promptUnblockBroadcaster = (pubKey: string) => {
    setAlert({
      title: 'Unblock broadcaster?',
      message: `Address: ${pubKey}.`,
      onClose: () => setAlert(undefined),
      onSubmit: async () => {
        setAlert(undefined);
        const blockedBroadcasterService = new BlockedBroadcasterService(dispatch);
        await blockedBroadcasterService.removeBlockedBroadcaster(pubKey);
      },
      submitTitle: 'Unblock',
    });
  };

  return (
    <>
      <GenericModal
        onClose={() => onClose(false)}
        title="Public Broadcaster Settings"
      >
        <div className={styles.settingsBroadcastersModalContainer}>
          <div className={styles.itemInnerContainer}>
            <div className={styles.flexContainer}>
              <Text className={styles.subheader}>Blocked Broadcasters</Text>
            </div>
          </div>
          {!broadcasterBlocklist.broadcasters.length && (
            <Text className={styles.label}>No blocked Broadcasters.</Text>
          )}
          {broadcasterBlocklist.broadcasters.map((blockedBroadcaster, index) => (
            <>
              <div className={styles.spacer} />
              <TextButton
                key={index}
                text={shortenWalletAddress(blockedBroadcaster.railgunAddress)}
                textClassName={styles.label}
                action={() =>
                  promptUnblockBroadcaster(blockedBroadcaster.railgunAddress)
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

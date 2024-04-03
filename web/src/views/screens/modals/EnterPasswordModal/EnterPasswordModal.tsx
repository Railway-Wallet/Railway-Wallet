import { isDefined } from '@railgun-community/shared-models';
import React, { SyntheticEvent, useEffect, useState } from 'react';
import cn from 'classnames';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { FullScreenSpinner } from '@components/loading/FullScreenSpinner/FullScreenSpinner';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import {
  lockoutTimeText,
  StorageService,
  useAppDispatch,
  usePinLockout,
} from '@react-shared';
import { hashPasswordString } from '@services/security/hash-service';
import { wipeDevice_DESTRUCTIVE } from '@services/security/wipe-device-service';
import { IconType } from '@services/util/icon-service';
import { Constants } from '@utils/constants';
import styles from './EnterPasswordModal.module.scss';

type Props = {
  success: (authKey: string) => void;
  onDismiss?: () => void;
  descriptionText?: string;
};

export const EnterPasswordModal: React.FC<Props> = ({
  success,
  onDismiss,
  descriptionText,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<Optional<Error>>();
  const [isLoading, setIsLoading] = useState(false);
  const [wipeAlert, setWipeAlert] = useState<AlertProps | undefined>(undefined);
  const [settingsAlert, setSettingsAlert] = useState<AlertProps | undefined>(
    undefined,
  );

  const dispatch = useAppDispatch();

  const wipeDevice = async () => {
    if (Constants.SHOULD_WIPE_DEVICES) {
      await wipeDevice_DESTRUCTIVE(dispatch, setSettingsAlert);
      setWipeAlert({
        title: 'Storage wiped',
        message: 'App reset to defaults.',
        onClose: () => setWipeAlert(undefined),
      });
    }
  };

  const {
    addFailedPinAttempt,
    resetFailedPinAttempts,
    secondsUntilLockoutExpiration,
    numFailedAttempts,
  } = usePinLockout(wipeDevice);

  useEffect(() => {
    if (secondsUntilLockoutExpiration <= 0) {
      setError(undefined);
      return;
    }
    if (secondsUntilLockoutExpiration > 0) {
      setError(
        new Error(
          lockoutTimeText(secondsUntilLockoutExpiration, numFailedAttempts),
        ),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsUntilLockoutExpiration]);

  const corrupted = () => {
    setError(new Error('Please refresh.'));
  };

  const incorrect = async () => {
    await addFailedPinAttempt();
    setError(new Error('Incorrect entry.'));
    setPassword('');
  };

  const onKeyDown = (keyEvent: KeyboardEvent) => {
    if (keyEvent.getModifierState('CapsLock')) {
      setError(new Error('Warning: Caps lock is on.'));
    } else {
      setError(undefined);
    }
  };

  const submit = async (e?: SyntheticEvent) => {
    e?.preventDefault();
    if (secondsUntilLockoutExpiration > 0) {
      return;
    }
    if (password.length < 1) {
      return;
    }

    setIsLoading(true);
    const [storedPasswordHash, storedSalt] = await Promise.all([
      StorageService.getItem(Constants.PASSWORD_HASH_STORED),
      StorageService.getItem(Constants.PASSWORD_SALT),
    ]);
    if (storedPasswordHash == null || storedSalt == null) {
      setIsLoading(false);
      corrupted();
      return;
    }

    try {
      const [dbEncryptionKey, hashPasswordStored] = await Promise.all([
        hashPasswordString(password, storedSalt, 100000),
        hashPasswordString(password, storedSalt, 1000000),
      ]);
      setIsLoading(false);
      if (hashPasswordStored !== storedPasswordHash) {
        await incorrect();
        return;
      }
      await resetFailedPinAttempts();
      success(dbEncryptionKey);
    } catch (err) {
      setIsLoading(false);
      setError(new Error('Error verifying password', { cause: err }));
    }
  };

  return (
    <GenericModal
      shouldCloseOnOverlayClick={isDefined(onDismiss)}
      onClose={onDismiss ? onDismiss : () => {}}
      title="Password verification"
      showClose={false}
    >
      <div className={styles.descriptionContainer}>
        <Text className={styles.description}>
          {descriptionText ??
            'This action requires authentication. Please enter your password to continue.'}
        </Text>
      </div>
      <form onSubmit={submit} className={styles.passwordModalForm}>
        <Input
          autoFocus={true}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          endIcon={IconType.Shield}
          iconSize={18}
          iconClassName={styles.inputIcon}
          disabled={secondsUntilLockoutExpiration > 0}
          onKeyDown={onKeyDown}
        />
        <Button
          buttonClassName={styles.submitButton}
          onClick={submit}
          disabled={!password.length || secondsUntilLockoutExpiration > 0}
        >
          Submit
        </Button>
      </form>
      <div className={styles.statusTextContainer}>
        {error && (
          <Text className={cn(styles.statusText, styles.statusTextError)}>
            {error.message}
          </Text>
        )}
      </div>
      <div className={styles.footerContainer}>
        <Text className={styles.footer}>
          {
            'Railway Wallet app does not connect to any centralized servers and stores all data encrypted locally (on your user device only).'
          }
        </Text>
      </div>
      {isLoading && <FullScreenSpinner />}
      {wipeAlert && <GenericAlert {...wipeAlert} />}
      {settingsAlert && <GenericAlert {...settingsAlert} />}
    </GenericModal>
  );
};

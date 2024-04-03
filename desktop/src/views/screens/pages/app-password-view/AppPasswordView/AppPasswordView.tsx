import { isDefined } from '@railgun-community/shared-models';
import { SyntheticEvent, useEffect, useState } from 'react';
import cn from 'classnames';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { FullScreenSpinner } from '@components/loading/FullScreenSpinner/FullScreenSpinner';
import { Text } from '@components/Text/Text';
import {
  ImageSwirl,
  lockoutTimeText,
  logDevError,
  StorageService,
  useAppDispatch,
  usePinLockout,
} from '@react-shared';
import { hashPasswordString } from '@services/security/hash-service';
import { wipeDevice_DESTRUCTIVE } from '@services/security/wipe-device-service';
import { Constants } from '@utils/constants';
import styles from './AppPasswordView.module.scss';

type Props = {
  success: (authKey: string) => void;
};

export const AppPasswordView: React.FC<Props> = ({ success }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<Optional<Error>>();
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);
  const [settingsAlert, setSettingsAlert] = useState<AlertProps | undefined>(
    undefined,
  );

  const dispatch = useAppDispatch();

  const wipeDevice = async () => {
    if (Constants.SHOULD_WIPE_DEVICES) {
      await wipeDevice_DESTRUCTIVE(dispatch, setSettingsAlert);
      setAlert({
        title: 'Storage wiped',
        message: 'App reset to defaults.',
        onClose: () => setAlert(undefined),
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
    if (!isDefined(storedPasswordHash) || !isDefined(storedSalt)) {
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
    } catch (cause) {
      setIsLoading(false);
      const error = new Error('Failed password submission.', { cause });
      logDevError(error);
      setError(error);
    }
  };

  return (
    <>
      <div
        className={cn('overlay-container', styles.appPasswordScreenContainer)}
      >
        <img src={ImageSwirl()} className={styles.swirl} alt="railway-swirl" />
        <Text className={styles.titleText}>RAILWAY</Text>
        <Text className={styles.headerText}>Enter password to continue</Text>
        <form onSubmit={submit} className={styles.inputForm}>
          <Input
            testId="app-password-input"
            autoFocus={true}
            overrideInputContainerClassName={styles.inputContainerOverride}
            overrideInputClassName={styles.inputOverride}
            value={password}
            onChange={event => setPassword(event.target.value)}
            type="password"
            disabled={secondsUntilLockoutExpiration > 0}
            onKeyDown={onKeyDown}
            rightView={
              <Button
                buttonClassName={styles.submitButton}
                onClick={submit}
                disabled={!password.length || secondsUntilLockoutExpiration > 0}
              >
                Submit
              </Button>
            }
          />
        </form>
        {isDefined(error) && (
          <div className={styles.errorTextContainer}>
            <Text className={styles.errorText}>{error.message}</Text>
          </div>
        )}
        <footer className={styles.footer}>
          <Text className={styles.footerText}>
            Your password is used to encrypt wallet data that is stored securely
            on your device.
          </Text>
        </footer>
        {isLoading && <FullScreenSpinner />}
      </div>
      {alert && <GenericAlert {...alert} />}
      {settingsAlert && <GenericAlert {...settingsAlert} />}
    </>
  );
};

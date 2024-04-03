import React, { SyntheticEvent, useState } from 'react';
import cn from 'classnames';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { FullScreenSpinner } from '@components/loading/FullScreenSpinner/FullScreenSpinner';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import {
  FrontendWallet,
  StorageService,
  useAppDispatch,
  useReduxSelector,
} from '@react-shared';
import { hashPasswordString } from '@services/security/hash-service';
import {
  changePassword,
  validatePassword,
} from '@services/security/password-service';
import { IconType } from '@services/util/icon-service';
import { Constants } from '@utils/constants';
import {
  AlertProps,
  GenericAlert,
} from '@views/components/alerts/GenericAlert/GenericAlert';
import styles from './ChangePasswordModal.module.scss';

type Props = {
  onClose: (closeAllModals: boolean) => void;
};

export const ChangePasswordModal: React.FC<Props> = ({ onClose }) => {
  const { wallets } = useReduxSelector('wallets');
  const dispatch = useAppDispatch();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [error, setError] = useState<Optional<Error>>();
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);

  const allWallets: FrontendWallet[] = [
    ...wallets.available,
    ...wallets.viewOnly,
  ];

  const onKeyDown = (keyEvent: KeyboardEvent) => {
    if (keyEvent.getModifierState('CapsLock')) {
      setError(new Error('Warning: Caps lock is on.'));
    } else {
      setError(undefined);
    }
  };

  const submit = async (e?: SyntheticEvent) => {
    e?.preventDefault();
    if (currentPassword.length < 1) {
      return;
    }

    setIsLoading(true);
    const [storedPasswordHash, storedSalt] = await Promise.all([
      StorageService.getItem(Constants.PASSWORD_HASH_STORED),
      StorageService.getItem(Constants.PASSWORD_SALT),
    ]);

    if (storedPasswordHash == null || storedSalt == null) {
      setError(new Error('Please refresh.'));
      setIsLoading(false);
      return;
    }

    try {
      const hashPasswordStored = await hashPasswordString(
        currentPassword,
        storedSalt,
        1000000,
      );

      if (hashPasswordStored !== storedPasswordHash) {
        setError(new Error('Incorrect password.'));
        setCurrentPassword('');
        setIsLoading(false);
        return;
      }

      if (newPassword.length < 8) {
        setError(
          new Error('Please select a password with at least 8 characters.'),
        );
        setIsLoading(false);
        return;
      }

      if (newPassword.length > 250) {
        setError(
          new Error('Please select a password with fewer than 250 characters.'),
        );
        setIsLoading(false);
        return;
      }

      if (!validatePassword(newPassword)) {
        setError(
          new Error(
            'Please select a password that is either longer or more complex (try adding upper case letters, numbers, or symbols).',
          ),
        );
        setIsLoading(false);
        return;
      }

      if (newPassword !== newPasswordConfirm) {
        setError(new Error('Passwords do not match.'));
        setIsLoading(false);
        return;
      }

      await changePassword(currentPassword, newPassword, allWallets, dispatch);
      setIsLoading(false);
      setAlert({
        title: 'Password changed successfully',
        submitTitle: 'Ok',
        shouldCloseOnOverlayClick: false,
        canDismiss: false,
        onClose: () => setAlert(undefined),
        onSubmit: () => {
          onClose(false);
          setAlert(undefined);
        },
      });
    } catch (err) {
      setIsLoading(false);
      setError(new Error('Error verifying password', { cause: err }));
    }
  };

  const disableSubmit =
    currentPassword.length < 1 ||
    newPassword.length < 1 ||
    newPasswordConfirm.length < 1;

  return (
    <GenericModal
      shouldCloseOnOverlayClick
      onClose={() => onClose(false)}
      title="Change password"
    >
      <div className={styles.descriptionContainer}>
        <Text className={styles.description}>
          {
            'This action requires authentication. Please enter your current password to create a new one.'
          }
        </Text>
      </div>
      <form onSubmit={submit} className={styles.passwordModalForm}>
        <Input
          autoFocus
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          placeholder="Current password"
          type="password"
          endIcon={IconType.Shield}
          iconSize={18}
          iconClassName={styles.inputIcon}
          overrideInputContainerClassName={styles.currentPasswordInput}
          onKeyDown={onKeyDown}
        />
        <Input
          autoFocus
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          placeholder="New password"
          type="password"
          endIcon={IconType.Shield}
          iconSize={18}
          iconClassName={styles.inputIcon}
          onKeyDown={onKeyDown}
        />
        <Input
          autoFocus
          value={newPasswordConfirm}
          onChange={e => setNewPasswordConfirm(e.target.value)}
          placeholder="Confirm new password"
          type="password"
          endIcon={IconType.Shield}
          iconSize={18}
          iconClassName={styles.inputIcon}
          onKeyDown={onKeyDown}
        />
        <Button
          buttonClassName={styles.submitButton}
          onClick={submit}
          disabled={disableSubmit}
        >
          Submit
        </Button>
      </form>
      {error && (
        <div className={styles.statusTextContainer}>
          <Text className={cn(styles.statusText, styles.statusTextError)}>
            {error.message}
          </Text>
        </div>
      )}
      <div className={styles.footerContainer}>
        <Text className={styles.footer}>
          {
            'Railway Wallet app does not connect to any centralized servers and stores all data encrypted locally (on your user device only).'
          }
        </Text>
      </div>
      {isLoading && <FullScreenSpinner />}
      {alert && <GenericAlert {...alert} />}
    </GenericModal>
  );
};

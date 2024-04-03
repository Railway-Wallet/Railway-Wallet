import React, { SyntheticEvent, useEffect, useState } from 'react';
import cn from 'classnames';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import {
  setPassword,
  validatePassword,
} from '@services/security/password-service';
import { IconType } from '@services/util/icon-service';
import styles from './CreatePasswordModal.module.scss';

type Props = {
  onComplete: (authKey: string) => void;
  onClose: () => void;
};

type StatusText = {
  message: string;
  isError: boolean;
};

export const CreatePasswordModal: React.FC<Props> = ({
  onComplete,
  onClose,
}) => {
  const [statusText, setStatusText] = useState<StatusText>({
    message: '',
    isError: false,
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [savedPasswordInput, setSavedPasswordInput] = useState('');
  const [hasValidEntries, setHasValidEntries] = useState(false);

  useEffect(() => {
    clearEntries();
    setStatusText({
      message: '',
      isError: false,
    });
    setHasValidEntries(false);
  }, []);

  const clearEntries = () => {
    setSavedPasswordInput('');
    setPasswordInput('');
  };

  const onSubmit = async (e?: SyntheticEvent) => {
    e?.preventDefault();
    if (savedPasswordInput.length) {
      await onSecondSubmit();
      return;
    }
    if (passwordInput.length === 0 || !hasValidEntries) {
      if (passwordInput.length < 8) {
        setStatusText({
          message: 'Please select a password with at least 8 characters.',
          isError: true,
        });
      } else if (passwordInput.length > 250) {
        setStatusText({
          message: 'Please select a password with fewer than 250 characters.',
          isError: true,
        });
      } else {
        setStatusText({
          message:
            'Please select a password that is either longer or more complex (try adding upper case letters, numbers, or symbols).',
          isError: true,
        });
      }

      return;
    }
    setStatusText({
      message: 'Please re-enter your password.',
      isError: false,
    });
    setSavedPasswordInput(passwordInput);
    setPasswordInput('');
  };

  const onSecondSubmit = async () => {
    if (passwordInput === savedPasswordInput) {
      await savePasswordAndComplete();
      return;
    }
    setStatusText({
      message: 'Passwords do not match. Please try again.',
      isError: true,
    });
    clearEntries();
  };

  const savePasswordAndComplete = async () => {
    try {
      const authKey = await setPassword(savedPasswordInput);
      onComplete(authKey);
    } catch (err) {
      setStatusText({
        message: err.message,
        isError: true,
      });
    }
  };

  const validateEntries = (value: string) => {
    setHasValidEntries(validatePassword(value));
  };

  const updatePasswordText = (e: React.BaseSyntheticEvent) => {
    const { value } = e.target;
    setPasswordInput(value);
    validateEntries(value);
  };

  const hasInputError = passwordInput.length > 0 && !hasValidEntries;

  return (
    <GenericModal onClose={onClose} title="Create password">
      <div className={styles.descriptionContainer}>
        <Text className={styles.description}>
          Your password is used to encrypt wallet data that is stored securely
          in your browser.
        </Text>
        <Text className={styles.description}>
          Use a strong password and DO NOT LOSE IT.
        </Text>
      </div>
      <form onSubmit={onSubmit} className={styles.createPasswordModalForm}>
        <Input
          testId="create-password-input"
          value={passwordInput}
          onChange={updatePasswordText}
          placeholder="Password"
          hasError={hasInputError}
          type="password"
          endIcon={IconType.Shield}
          iconSize={18}
          iconClassName={styles.inputIcon}
        />
        <Button
          buttonClassName={styles.submitButton}
          onClick={onSubmit}
          disabled={!passwordInput.length}
        >
          Submit
        </Button>
      </form>
      <div className={styles.statusTextContainer}>
        <Text
          className={cn(styles.statusText, {
            [styles.statusTextError]: statusText.isError,
          })}
        >
          {statusText.message}
        </Text>
      </div>
      <div className={styles.footerContainer}>
        <Text className={styles.footer}>
          {
            'Railway Wallet app does not connect to any centralized servers and stores all data encrypted locally (on your user device only).'
          }
        </Text>
      </div>
    </GenericModal>
  );
};

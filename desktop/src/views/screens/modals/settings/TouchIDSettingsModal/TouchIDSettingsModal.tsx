import { useEffect, useState } from 'react';
import { Button } from '@components/Button/Button';
import { FullScreenSpinner } from '@components/loading/FullScreenSpinner/FullScreenSpinner';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import {
  deleteBiometricKey,
  enrollBiometricKey,
  getBiometricStatus,
} from '@services/security/biometric-service';
import { IconType } from '@services/util/icon-service';
import { BiometricStatus } from '@utils/user-agent';
import styles from './TouchIDSettingsModal.module.scss';

type Props = {
  onClose: () => void;
};

const errorMessage = (error?: string) => {
  switch (error) {
    case 'cancelled':
      return 'Touch ID setup was cancelled.';
    case 'authentication-failed':
      return 'Touch ID could not verify your fingerprint.';
    case 'unavailable':
      return 'Touch ID is unavailable on this Mac.';
    default:
      return 'Touch ID settings could not be updated.';
  }
};

export const TouchIDSettingsModal = ({ onClose }: Props) => {
  const [status, setStatus] = useState<BiometricStatus>();
  const [authenticating, setAuthenticating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    void getBiometricStatus().then(nextStatus => {
      if (active) setStatus(nextStatus);
    });
    return () => {
      active = false;
    };
  }, []);

  const enable = async (authKey: string) => {
    setAuthenticating(false);
    setIsLoading(true);
    setMessage(undefined);
    setError(undefined);

    const result = await enrollBiometricKey(authKey);
    setIsLoading(false);
    if (!result.success) {
      setError(errorMessage(result.error));
      return;
    }

    setStatus(current => ({
      available: current?.available ?? true,
      enrolled: true,
    }));
    setMessage('Touch ID is enabled.');
  };

  const disable = async () => {
    setIsLoading(true);
    setMessage(undefined);
    setError(undefined);

    const result = await deleteBiometricKey();
    setIsLoading(false);
    if (!result.success) {
      setError(errorMessage(result.error));
      return;
    }

    setStatus(current => ({
      available: current?.available ?? true,
      enrolled: false,
    }));
    setMessage('Touch ID is disabled.');
  };

  if (authenticating) {
    return (
      <EnterPasswordModal
        descriptionText="Enter your Railway password once to enable Touch ID."
        success={authKey => void enable(authKey)}
        onDismiss={() => setAuthenticating(false)}
      />
    );
  }

  return (
    <GenericModal onClose={onClose} title="Touch ID">
      <div className={styles.container}>
        <Text className={styles.description}>
          {status?.enrolled === true
            ? 'Touch ID can unlock Railway. Your Railway password remains available as a fallback.'
            : 'Use Touch ID to unlock Railway without entering your password each time.'}
        </Text>

        {status !== undefined && !status.available && (
          <Text className={styles.error}>
            Touch ID is unavailable or not configured on this Mac.
          </Text>
        )}

        {status?.available === true && (
          <Button
            buttonClassName={styles.actionButton}
            startIcon={IconType.Fingerprint}
            iconSize={20}
            onClick={
              status.enrolled
                ? () => void disable()
                : () => setAuthenticating(true)
            }
            disabled={isLoading}
          >
            {status.enrolled ? 'Disable Touch ID' : 'Enable Touch ID'}
          </Button>
        )}

        {message !== undefined && (
          <Text className={styles.message}>{message}</Text>
        )}
        {error !== undefined && <Text className={styles.error}>{error}</Text>}
      </div>
      {(status === undefined || isLoading) && <FullScreenSpinner />}
    </GenericModal>
  );
};

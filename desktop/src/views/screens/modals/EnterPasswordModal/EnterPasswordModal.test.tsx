import type { MouseEventHandler, ReactNode } from 'react';
import {
  getBiometricStatus,
  retrieveBiometricKey,
} from '@services/security/biometric-service';
import { render, waitFor } from '@testing-library/react';
import { EnterPasswordModal } from './EnterPasswordModal';

jest.mock('@components/alerts/GenericAlert/GenericAlert', () => ({
  GenericAlert: () => null,
}));
jest.mock('@components/Button/Button', () => ({
  Button: ({
    children,
    disabled,
    onClick,
  }: {
    children: ReactNode;
    disabled?: boolean;
    onClick?: MouseEventHandler<HTMLButtonElement>;
  }) => (
    <button disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
}));
jest.mock('@components/Input/Input', () => ({ Input: () => <input /> }));
jest.mock(
  '@components/loading/FullScreenSpinner/FullScreenSpinner',
  () => ({ FullScreenSpinner: () => null }),
);
jest.mock('@components/modals/GenericModal/GenericModal', () => ({
  GenericModal: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock('@components/Text/Text', () => ({
  Text: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
jest.mock('@react-shared', () => {
  const pinLockout = {
    addFailedPinAttempt: jest.fn(),
    resetFailedPinAttempts: jest.fn(),
    secondsUntilLockoutExpiration: 0,
    numFailedAttempts: 0,
  };
  return {
    lockoutTimeText: jest.fn(),
    StorageService: {
      getItem: jest.fn(),
    },
    useAppDispatch: () => jest.fn(),
    usePinLockout: () => pinLockout,
  };
});
jest.mock('@services/security/biometric-service', () => ({
  getBiometricStatus: jest.fn(),
  retrieveBiometricKey: jest.fn(),
}));
jest.mock('@services/security/wipe-device-service', () => ({
  wipeDevice_DESTRUCTIVE: jest.fn(),
}));

const mockGetBiometricStatus = getBiometricStatus as jest.MockedFunction<
  typeof getBiometricStatus
>;
const mockRetrieveBiometricKey = retrieveBiometricKey as jest.MockedFunction<
  typeof retrieveBiometricKey
>;

describe('EnterPasswordModal Touch ID', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBiometricStatus.mockResolvedValue({
      available: true,
      enrolled: true,
    });
    mockRetrieveBiometricKey.mockResolvedValue({
      success: true,
      key: 'a'.repeat(64),
    });
  });

  it('uses Touch ID automatically for password prompts', async () => {
    const success = jest.fn();
    render(
      <EnterPasswordModal success={success} onDismiss={jest.fn()} />,
    );

    await waitFor(() => {
      expect(success).toHaveBeenCalledWith('a'.repeat(64));
    });
    expect(mockRetrieveBiometricKey).toHaveBeenCalledTimes(1);
  });

  it('keeps the password fallback when Touch ID is not enrolled', async () => {
    mockGetBiometricStatus.mockResolvedValue({
      available: true,
      enrolled: false,
    });

    render(
      <EnterPasswordModal success={jest.fn()} onDismiss={jest.fn()} />,
    );

    await waitFor(() => {
      expect(mockGetBiometricStatus).toHaveBeenCalledTimes(1);
    });
    expect(mockRetrieveBiometricKey).not.toHaveBeenCalled();
  });
});

import {
  deleteBiometricKey,
  enrollBiometricKey,
  getBiometricStatus,
  isTouchIDPlatform,
  retrieveBiometricKey,
} from './biometric-service';

const originalUserAgent = navigator.userAgent;

const setUserAgent = (userAgent: string) => {
  Object.defineProperty(navigator, 'userAgent', {
    configurable: true,
    value: userAgent,
  });
};

const createBridge = () => ({
  addFocusListener: jest.fn(),
  removeFocusListener: jest.fn(),
  wipeDeviceData: jest.fn(),
  getBiometricStatus: jest.fn().mockResolvedValue({
    available: true,
    enrolled: true,
  }),
  enrollBiometricKey: jest.fn().mockResolvedValue({ success: true }),
  retrieveBiometricKey: jest.fn().mockResolvedValue({
    success: true,
    key: `0x${'a'.repeat(64)}`,
  }),
  deleteBiometricKey: jest.fn().mockResolvedValue({ success: true }),
});

describe('biometric-service', () => {
  afterEach(() => {
    setUserAgent(originalUserAgent);
    Reflect.deleteProperty(window, 'electronBridge');
  });

  it('uses the isolated Electron bridge on macOS', async () => {
    setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Electron/28.3.3',
    );
    const bridge = createBridge();
    Object.defineProperty(window, 'electronBridge', {
      configurable: true,
      value: bridge,
    });

    expect(isTouchIDPlatform()).toBe(true);
    await expect(getBiometricStatus()).resolves.toEqual({
      available: true,
      enrolled: true,
    });
    await expect(enrollBiometricKey(`0x${'b'.repeat(64)}`)).resolves.toEqual({
      success: true,
    });
    await expect(retrieveBiometricKey()).resolves.toEqual({
      success: true,
      key: `0x${'a'.repeat(64)}`,
    });
    await expect(deleteBiometricKey()).resolves.toEqual({ success: true });
  });

  it('returns unavailable without exposing the bridge on other platforms', async () => {
    setUserAgent('Mozilla/5.0 (X11; Linux x86_64) Electron/28.3.3');

    expect(isTouchIDPlatform()).toBe(false);
    await expect(getBiometricStatus()).resolves.toEqual({
      available: false,
      enrolled: false,
    });
    await expect(retrieveBiometricKey()).resolves.toEqual({
      success: false,
      error: 'unavailable',
    });
  });
});

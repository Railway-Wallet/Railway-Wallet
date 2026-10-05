const { spawn } = require('child_process');
const { randomUUID } = require('crypto');
const { app, safeStorage, systemPreferences } = require('electron');
const fs = require('fs/promises');
const path = require('path');
const { isValidAuthKey } = require('./auth-key');

const HELPER_NAME = 'RailwayBiometricKeychain';
const MAX_OUTPUT_BYTES = 4096;
const HELPER_TIMEOUT_MS = 60000;
const FALLBACK_FILE_NAME = 'biometric-key.safe-storage';

const errorForExitCode = code => {
  switch (code) {
    case 10:
      return 'cancelled';
    case 11:
      return 'authentication-failed';
    case 12:
      return 'not-enrolled';
    case 13:
      return 'unavailable';
    default:
      return 'failed';
  }
};

const getHelperPath = () => {
  if (!app.isPackaged) {
    return path.join(__dirname, '..', 'dist', 'native', HELPER_NAME);
  }
  return path.join(process.resourcesPath, '..', 'MacOS', HELPER_NAME);
};

const getFallbackPath = () =>
  path.join(app.getPath('userData'), FALLBACK_FILE_NAME);

const fallbackExists = async () => {
  try {
    await fs.access(getFallbackPath());
    return true;
  } catch {
    return false;
  }
};

const fallbackAvailable = () => {
  try {
    return (
      process.platform === 'darwin' &&
      safeStorage.isEncryptionAvailable() &&
      systemPreferences.canPromptTouchID()
    );
  } catch {
    return false;
  }
};

const promptTouchID = async reason => {
  try {
    await systemPreferences.promptTouchID(reason);
    return true;
  } catch {
    return false;
  }
};

const runHelper = (command, input) =>
  new Promise(resolve => {
    if (process.platform !== 'darwin') {
      resolve({ code: 13, stdout: '' });
      return;
    }

    const child = spawn(getHelperPath(), [command], {
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    let stdout = '';
    let outputExceeded = false;
    let settled = false;

    const finish = result => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(result);
    };

    const timeout = setTimeout(() => {
      child.kill();
      finish({ code: 14, stdout: '' });
    }, HELPER_TIMEOUT_MS);

    child.stdout.on('data', data => {
      if (outputExceeded) return;
      stdout += data.toString('utf8');
      if (Buffer.byteLength(stdout, 'utf8') > MAX_OUTPUT_BYTES) {
        outputExceeded = true;
        child.kill();
      }
    });

    child.on('error', () => finish({ code: 14, stdout: '' }));
    child.on('close', code =>
      finish({
        code: outputExceeded ? 14 : code ?? 14,
        stdout: outputExceeded ? '' : stdout,
      })
    );

    if (input) {
      child.stdin.end(input, 'utf8');
    } else {
      child.stdin.end();
    }
  });

const getNativeStatus = async () => {
  const result = await runHelper('status');
  if (result.code !== 0) {
    return { available: false, enrolled: false, strongProtection: false };
  }

  try {
    const status = JSON.parse(result.stdout);
    return {
      available: status.available === true,
      enrolled: status.enrolled === true,
      strongProtection: status.strongProtection === true,
    };
  } catch {
    return { available: false, enrolled: false, strongProtection: false };
  }
};

const storeNativeKey = async authKey => {
  if (!isValidAuthKey(authKey)) {
    return { success: false, error: 'invalid-key' };
  }

  const result = await runHelper('store', authKey);
  return result.code === 0
    ? { success: true }
    : { success: false, error: errorForExitCode(result.code) };
};

const retrieveNativeKey = async () => {
  const result = await runHelper('retrieve');
  if (result.code !== 0) {
    return { success: false, error: errorForExitCode(result.code) };
  }
  if (!isValidAuthKey(result.stdout)) {
    return { success: false, error: 'failed' };
  }
  return { success: true, key: result.stdout };
};

const deleteNativeKey = async () => {
  const result = await runHelper('delete');
  return result.code === 0
    ? { success: true }
    : { success: false, error: errorForExitCode(result.code) };
};

const storeFallbackKey = async authKey => {
  if (!fallbackAvailable()) {
    return { success: false, error: 'unavailable' };
  }

  const authenticated = await promptTouchID(
    'Enable Touch ID for Railway Wallet'
  );
  if (!authenticated) {
    return { success: false, error: 'cancelled' };
  }

  const encrypted = safeStorage.encryptString(authKey);
  const fallbackPath = getFallbackPath();
  const temporaryPath = `${fallbackPath}.${process.pid}.${randomUUID()}.tmp`;

  try {
    await fs.writeFile(temporaryPath, encrypted, {
      flag: 'wx',
      mode: 0o600,
    });
    await fs.rename(temporaryPath, fallbackPath);
    return { success: true };
  } catch {
    await fs.unlink(temporaryPath).catch(() => {});
    return { success: false, error: 'failed' };
  }
};

const retrieveFallbackKey = async () => {
  if (!(await fallbackExists())) {
    return { success: false, error: 'not-enrolled' };
  }
  if (!fallbackAvailable()) {
    return { success: false, error: 'unavailable' };
  }

  const authenticated = await promptTouchID('Unlock Railway Wallet');
  if (!authenticated) {
    return { success: false, error: 'cancelled' };
  }

  try {
    const encrypted = await fs.readFile(getFallbackPath());
    const authKey = safeStorage.decryptString(encrypted);
    if (!isValidAuthKey(authKey)) {
      return { success: false, error: 'failed' };
    }
    return { success: true, key: authKey };
  } catch {
    return { success: false, error: 'failed' };
  }
};

const deleteFallbackKey = async () => {
  try {
    await fs.unlink(getFallbackPath());
    return { success: true };
  } catch (error) {
    return error?.code === 'ENOENT'
      ? { success: true }
      : { success: false, error: 'failed' };
  }
};

const getStatus = async () => {
  const [nativeStatus, hasFallback] = await Promise.all([
    getNativeStatus(),
    fallbackExists(),
  ]);
  return {
    available:
      (nativeStatus.strongProtection && nativeStatus.available) ||
      fallbackAvailable(),
    enrolled:
      (nativeStatus.strongProtection && nativeStatus.enrolled) || hasFallback,
  };
};

const enrollKey = async authKey => {
  if (!isValidAuthKey(authKey)) {
    return { success: false, error: 'invalid-key' };
  }

  const nativeStatus = await getNativeStatus();
  if (nativeStatus.strongProtection) {
    const nativeStored = await storeNativeKey(authKey);
    if (!nativeStored.success) return nativeStored;

    const retrieved = await retrieveNativeKey();
    if (retrieved.success && retrieved.key === authKey) {
      await deleteFallbackKey();
      return { success: true };
    }

    await deleteNativeKey();
    return {
      success: false,
      error: retrieved.success ? 'failed' : retrieved.error,
    };
  }

  return storeFallbackKey(authKey);
};

const retrieveKey = async () => {
  const nativeStatus = await getNativeStatus();
  if (nativeStatus.strongProtection && nativeStatus.enrolled) {
    return retrieveNativeKey();
  }
  return retrieveFallbackKey();
};

const deleteKey = async () => {
  const nativeStatus = await getNativeStatus();
  const [nativeResult, fallbackResult] = await Promise.all([
    deleteNativeKey(),
    deleteFallbackKey(),
  ]);

  if (!fallbackResult.success) return fallbackResult;
  if (nativeStatus.enrolled && !nativeResult.success) return nativeResult;
  return { success: true };
};

module.exports = {
  deleteKey,
  enrollKey,
  getStatus,
  retrieveKey,
};

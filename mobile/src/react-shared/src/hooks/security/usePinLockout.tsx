import { isDefined } from "@railgun-community/shared-models";
import { useEffect, useRef, useState } from "react";
import { SharedConstants } from "../../config/shared-constants";
import { StorageService } from "../../services/storage/storage-service";
import { logDev } from "../../utils/logging";

export const usePinLockout = (wipeDevice: () => Promise<void>) => {
  const [secondsUntilExpiration, setSecondsUntilExpiration] =
    useState<Optional<number>>(undefined);
  const [numFailedAttempts, setNumFailedAttempts] = useState(0);
  const [pinLockoutTimestamp, setPinLockoutTimestamp] = useState(0);

  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const getFromStorage = async () => {
      const storedPinLockoutTimestamp = await getPinLockoutStart();
      if (!isDefined(storedPinLockoutTimestamp)) {
        await storedValuesDeleted();
        return;
      }
      setPinLockoutTimestamp(storedPinLockoutTimestamp ?? 0);

      const storedNumFailedAttempts = await getFailedPinAttempts();
      if (!isDefined(storedNumFailedAttempts)) {
        await storedValuesDeleted();
        return;
      }
      logDev(`failed attempts: ${storedNumFailedAttempts}`);
      setNumFailedAttempts(storedNumFailedAttempts);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const runTimerIfNecessary = () => {
      const secTilExpiry = getSecondsUntilExpiration();
      if (secTilExpiry > 0) {
        logDev(
          `[failed attempt: ${numFailedAttempts}] secTilExpiry: ${Math.ceil(
            secTilExpiry
          )}`
        );
        clearTimer();
        timer.current = setInterval(tick, 1000);
        const calcSecondsUntilExpiration = getSecondsUntilExpiration();
        setSecondsUntilExpiration(calcSecondsUntilExpiration);
      }
    };
    runTimerIfNecessary();
    return () => {
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numFailedAttempts]);

  const clearTimer = () => {
    if (timer.current) {
      clearInterval(timer.current);
    }
  };

  const tick = () => {
    const secTilExpiry = getSecondsUntilExpiration();
    logDev(`secTilExpiry: ${Math.ceil(secTilExpiry)}`);
    setSecondsUntilExpiration(secTilExpiry);
    if (secTilExpiry <= 0) {
      clearTimer();
    }
  };

  const secondsForCurrentFailedAttempts = (): number => {
    if (numFailedAttempts <= 2) {
      return 0;
    } else if (numFailedAttempts === 3) {
      return 1 * 60;
    } else if (numFailedAttempts === 4) {
      return 10 * 60;
    } else if (numFailedAttempts === 5) {
      return 1 * 60 * 60;
    } else if (numFailedAttempts === 6) {
      return 4 * 60 * 60;
    } else if (numFailedAttempts >= 7) {
      return 72 * 60 * 60;
    } else {
      throw new Error("Unhandled lockout.");
    }
  };

  const getSecondsUntilExpiration = (): number => {
    const secondsElapsed = (Date.now() - pinLockoutTimestamp) / 1000;
    const calcSecondsUntilExpiration = secondsForCurrentFailedAttempts();
    return calcSecondsUntilExpiration - secondsElapsed;
  };

  const updatePinLockoutStart = async (timestamp: number): Promise<void> => {
    await StorageService.setItem(
      SharedConstants.PIN_LOCKOUT_TIMESTAMP,
      String(timestamp)
    );
  };

  const getPinLockoutStart = async (): Promise<Optional<number>> => {
    const pinLockoutStart = await StorageService.getItem(
      SharedConstants.PIN_LOCKOUT_TIMESTAMP
    );

    if (!isDefined(pinLockoutStart)) {
      return;
    }

    return parseInt(pinLockoutStart, 10);
  };

  const addFailedPinAttempt = async (override?: number): Promise<void> => {
    const totalFailedAttempts = override ?? numFailedAttempts + 1;
    logDev(`Total failed attempts: ${totalFailedAttempts}`);
    await StorageService.setItem(
      SharedConstants.NUM_ENTER_PIN_FAILED_ATTEMPTS,
      String(totalFailedAttempts)
    );
    if (
      totalFailedAttempts >= SharedConstants.NUM_FAILED_ATTEMPTS_FOR_DEVICE_WIPE
    ) {
      logDev("DEVICE WIPE");
      await wipeDevice();
      await resetFailedPinAttempts();
    } else if (totalFailedAttempts >= 3) {
      logDev("LOCKOUT START");
      const timestamp = Date.now();
      setPinLockoutTimestamp(timestamp);
      setNumFailedAttempts(totalFailedAttempts);
      await updatePinLockoutStart(timestamp);
    } else {
      setNumFailedAttempts(totalFailedAttempts);
    }
  };

  const resetFailedPinAttempts = async (): Promise<void> => {
    logDev("Reset failed pin attempts.");
    setNumFailedAttempts(0);
    setSecondsUntilExpiration(undefined);
    await StorageService.setItem(
      SharedConstants.NUM_ENTER_PIN_FAILED_ATTEMPTS,
      String(0)
    );
    await updatePinLockoutStart(0);
  };

  const getFailedPinAttempts = async (): Promise<Optional<number>> => {
    const failedAttemptsString = await StorageService.getItem(
      SharedConstants.NUM_ENTER_PIN_FAILED_ATTEMPTS
    );

    if (!isDefined(failedAttemptsString)) {
      return;
    }

    return parseInt(failedAttemptsString, 10);
  };

  const storedValuesDeleted = async () => {
    await addFailedPinAttempt(4);
  };

  return {
    addFailedPinAttempt,
    resetFailedPinAttempts,
    secondsUntilLockoutExpiration: secondsUntilExpiration ?? 0,
    numFailedAttempts,
  };
};

export const lockoutTimeText = (
  secondsUntilLockoutExpiration: number,
  numFailedAttempts: number
) => {
  let text = "Too many incorrect entries. Locked out for ";
  if (secondsUntilLockoutExpiration < 60) {
    text += "1 minute.";
  } else if (secondsUntilLockoutExpiration < 60 * 60) {
    const minLowerBound = Math.floor(secondsUntilLockoutExpiration / 60);
    text += `${minLowerBound + 1} minutes.`;
  } else {
    const minLowerBound = Math.floor(secondsUntilLockoutExpiration / 3600);
    text += `${minLowerBound + 1} hours.`;
  }
  if (
    numFailedAttempts + 3 >=
    SharedConstants.NUM_FAILED_ATTEMPTS_FOR_DEVICE_WIPE
  ) {
    const numUntilWipe =
      SharedConstants.NUM_FAILED_ATTEMPTS_FOR_DEVICE_WIPE - numFailedAttempts;
    text += ` ${numUntilWipe} more attempts until storage is wiped.`;
  }
  return text;
};

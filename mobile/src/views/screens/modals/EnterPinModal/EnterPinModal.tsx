import { isDefined } from "@railgun-community/shared-models";
import React, { useEffect, useState } from "react";
import { Animated, Dimensions, Modal, Text, View } from "react-native";
import { SwirlBackground } from "@components/images/SwirlBackground/SwirlBackground";
import { PinEntryDots } from "@components/inputs/PinEntryDots/PinEntryDots";
import { PinEntryPanel } from "@components/inputs/PinEntryPanel/PinEntryPanel";
import { FullScreenSpinner } from "@components/loading/FullScreenSpinner/FullScreenSpinner";
import { useNavigation } from "@react-navigation/native";
import {
  ImageSwirl,
  lockoutTimeText,
  logDev,
  useAppDispatch,
  usePinLockout,
} from "@react-shared";
import {
  compareEncryptedPin,
  getEncryptedPin,
} from "@services/security/secure-app-service";
import { wipeDevice_DESTRUCTIVE } from "@services/security/wipe-device-service";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { Constants } from "@utils/constants";
import { imageHeightFromDesiredWidth } from "@utils/image-utils";
import { styles } from "./styles";

type Props = {
  show: boolean;
  allowBackNav?: boolean;
  authorizeSession: (key: string) => void;
};

const PIN_LENGTH = 6;

export const EnterPinModal: React.FC<Props> = ({
  show,
  allowBackNav = false,
  authorizeSession,
}) => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const shakeAnimation = new Animated.Value(0);

  const [enteredPin, setEnteredPin] = useState("");
  const [error, setError] = useState<Optional<Error>>();
  const [isProcessing, setIsProcessing] = useState(false);

  const wipeDevice = async () => {
    if (Constants.SHOULD_WIPE_DEVICES) {
      await wipeDevice_DESTRUCTIVE(dispatch);
      navigation.goBack();
    }
  };

  const {
    addFailedPinAttempt,
    resetFailedPinAttempts,
    secondsUntilLockoutExpiration,
    numFailedAttempts,
  } = usePinLockout(wipeDevice);

  const authorize = async (key: string) => {
    authorizeSession(key);
    await resetFailedPinAttempts();
  };

  useEffect(() => {
    const submitIfNecessary = async () => {
      const storedPin = await getEncryptedPin();
      if (!isDefined(storedPin)) {
        return authorize("");
      }
      if (enteredPin.length < PIN_LENGTH) {
        return;
      }
      logDev(storedPin);
      setIsProcessing(true);
      const pinsMatch = await compareEncryptedPin(enteredPin);
      setIsProcessing(false);
      if (pinsMatch) {
        return authorize(storedPin);
      }
      incorrectPin();
    };
    if (show) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      submitIfNecessary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enteredPin, show]);

  useEffect(() => {
    if (show) {
      setEnteredPin("");
    }
  }, [show]);

  useEffect(() => {
    if (secondsUntilLockoutExpiration <= 0) {
      setError(undefined);
      return;
    }
    if (secondsUntilLockoutExpiration > 0) {
      setError(
        new Error(
          lockoutTimeText(secondsUntilLockoutExpiration, numFailedAttempts)
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsUntilLockoutExpiration]);

  const incorrectPin = () => {
    setTimeout(async () => {
      setEnteredPin("");
      setError(new Error("Incorrect PIN."));
      await addFailedPinAttempt();
    }, 250);
    shakePinWrapper();
  };

  const shakePinWrapper = () => {
    triggerHaptic(HapticSurface.NotifyError);
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onTapPanelButton = (num: number) => {
    if (enteredPin.length < PIN_LENGTH && secondsUntilLockoutExpiration <= 0) {
      triggerHaptic(HapticSurface.NumPad);
      setEnteredPin(enteredPin + String(num));
      if (isDefined(error)) {
        setError(undefined);
      }
    }
  };

  const onTapBackspaceButton = () => {
    if (enteredPin.length > 0 && secondsUntilLockoutExpiration <= 0) {
      triggerHaptic(HapticSurface.BackButton);
      removeOneCharFromPin();
    }
  };

  const removeOneCharFromPin = () => {
    setEnteredPin(enteredPin.slice(0, -1));
  };

  const windowWidth = Dimensions.get("window").width;
  const swirlWidth = windowWidth * 0.8;
  const swirlHeight = imageHeightFromDesiredWidth(ImageSwirl(), swirlWidth);

  return (
    <Modal
      animationType="slide"
      presentationStyle="fullScreen"
      visible={show}
      onRequestClose={() => {
        if (allowBackNav) {
          navigation.goBack();
        }
      }}
    >
      <View style={styles.wrapper}>
        <SwirlBackground
          style={{
            ...styles.swirlBackground,
            width: swirlWidth,
            height: swirlHeight,
          }}
        />
        <Animated.View
          style={[
            styles.pinTitleDotsWrapper,
            { transform: [{ translateX: shakeAnimation }] },
          ]}
        >
          <Text style={styles.titleText}>Enter Pin</Text>
          <PinEntryDots enteredPinLength={enteredPin.length} />
        </Animated.View>
        {isDefined(error) && (
          <View style={styles.noticeTextWrapper}>
            <Text style={styles.errorText}>{error.message}</Text>
          </View>
        )}
        <View style={styles.pinEntryPanelWrapper}>
          <PinEntryPanel
            enteredPinLength={enteredPin.length}
            onTapPanelButton={onTapPanelButton}
            onTapBackspaceButton={onTapBackspaceButton}
          />
        </View>
      </View>
      <FullScreenSpinner show={isProcessing} />
    </Modal>
  );
};

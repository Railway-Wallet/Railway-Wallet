import { isDefined } from "@railgun-community/shared-models";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Modal, Text, View } from "react-native";
import { ButtonTextOnly } from "@components/buttons/ButtonTextOnly/ButtonTextOnly";
import { SwirlBackground } from "@components/images/SwirlBackground/SwirlBackground";
import { PinEntryDots } from "@components/inputs/PinEntryDots/PinEntryDots";
import { PinEntryPanel } from "@components/inputs/PinEntryPanel/PinEntryPanel";
import {
  BiometricsAuthResponse,
  ImageSwirl,
  setAuthKey,
  useAppDispatch,
  useReduxSelector,
} from "@react-shared";
import {
  getOrCreateDbEncryptionKey,
  storeNewDbEncryptionKey,
} from "@services/core/db";
import {
  biometricsAuthenticate,
  getBiometryType,
} from "@services/security/biometrics-service";
import {
  compareEncryptedPin,
  setEncryptedPin,
  setHasBiometricsEnabled,
} from "@services/security/secure-app-service";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { imageHeightFromDesiredWidth } from "@utils/image-utils";
import { ErrorDetailsModal } from "../ErrorDetailsModal/ErrorDetailsModal";
import { styles } from "./styles";

type Props = {
  show: boolean;
  dismiss: () => void;
};

const PIN_LENGTH = 6;

export const CreatePinModal: React.FC<Props> = ({ show, dismiss }) => {
  const { authKey } = useReduxSelector("authKey");
  const dispatch = useAppDispatch();

  const [enteredPin, setEnteredPin] = useState("");
  const [firstEntryPin, setFirstEntryPin] = useState("");
  const [error, setError] = useState<Optional<Error>>();
  const [noticeText, setNoticeText] = useState("");
  const inputFrozen = useRef(false);
  const [showErrorDetailsModal, setShowErrorDetailsModal] = useState(false);

  const openErrorDetailsModal = () => {
    setShowErrorDetailsModal(true);
  };
  const dismissErrorDetailsModal = () => {
    setShowErrorDetailsModal(false);
  };

  useEffect(() => {
    const lockFirstEntry = () => {
      setFirstEntryPin(enteredPin);
      setError(undefined);
      setNoticeText("Please re-enter your PIN.");
      setEnteredPin("");
    };
    const confirmAndSubmit = async () => {
      if (enteredPin !== firstEntryPin) {
        setFirstEntryPin("");
        setError(new Error("Entry did not match. Please select a new PIN."));
        setNoticeText("");
        setEnteredPin("");
        return;
      }
      inputFrozen.current = true;

      const dbEncryptionKey = await getOrCreateDbEncryptionKey();
      const encryptedPin = await setEncryptedPin(enteredPin);
      if (await compareEncryptedPin(enteredPin)) {
        const previousAuthKey = authKey.key;
        dispatch(setAuthKey(encryptedPin));
        await storeNewDbEncryptionKey(
          encryptedPin,
          dbEncryptionKey,
          previousAuthKey
        );
        await tryEnableBiometry();
        dismiss();
      }
    };
    if (show && enteredPin.length) {
      setError(undefined);
      if (enteredPin.length === PIN_LENGTH) {
        const isFirstEntryState = firstEntryPin === "";
        if (isFirstEntryState) {
          lockFirstEntry();
        } else {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          confirmAndSubmit();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enteredPin, show]);

  const tryEnableBiometry = async () => {
    const biometryType = await getBiometryType();
    if (!biometryType) {
      return;
    }
    const authResponse = await biometricsAuthenticate();
    const isEnabled = authResponse !== BiometricsAuthResponse.Denied;
    await setHasBiometricsEnabled(isEnabled);
  };

  const onTapPanelButton = (num: number) => {
    if (inputFrozen.current) {
      return;
    }

    if (enteredPin.length < PIN_LENGTH) {
      triggerHaptic(HapticSurface.NumPad);
      setEnteredPin(enteredPin + String(num));
    }
  };

  const onTapBackspaceButton = () => {
    if (inputFrozen.current) {
      return;
    }

    if (enteredPin.length > 0) {
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
    <Modal animationType="slide" presentationStyle="fullScreen" visible={show}>
      <View style={styles.wrapper}>
        <SwirlBackground
          style={{
            ...styles.swirlBackground,
            width: swirlWidth,
            height: swirlHeight,
          }}
        />
        <View style={[styles.pinTitleDotsWrapper]}>
          <Text style={styles.titleText}>
            {!firstEntryPin ? "Set PIN" : "Confirm PIN"}
          </Text>
          <PinEntryDots enteredPinLength={enteredPin.length} />
        </View>
        <View style={styles.noticeTextWrapper}>
          {noticeText !== "" && (
            <Text style={styles.noticeText}>{noticeText}</Text>
          )}
          {isDefined(error) && (
            <>
              <Text style={styles.errorText}>
                {error.message}{" "}
                <Text
                  style={styles.errorShowMore}
                  onPress={openErrorDetailsModal}
                >
                  (show more)
                </Text>
              </Text>
              <ErrorDetailsModal
                error={error}
                show={showErrorDetailsModal}
                onDismiss={dismissErrorDetailsModal}
              />
            </>
          )}
        </View>
        <View style={styles.pinEntryPanelWrapper}>
          <PinEntryPanel
            enteredPinLength={enteredPin.length}
            onTapPanelButton={onTapPanelButton}
            onTapBackspaceButton={onTapBackspaceButton}
          />
        </View>
        <View style={styles.bottomButtons}>
          <View style={styles.bottomButton}>
            <ButtonTextOnly
              title="Cancel"
              onTap={dismiss}
              labelStyle={styles.bottomButtonLabel}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

import React, { useEffect } from "react";
import { Button, Modal, View } from "react-native";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { styleguide } from "@react-shared";
import { createQrScanner } from "@services/util/qr-scan-service";
import { styles } from "./styles";

type Props = {
  show: boolean;
  onDismiss: (readData?: string) => void;
  mockResponse_DevOnly?: string;
};

const MOCKED_ADDRESS = "0x9E9F988356f46744Ee0374A17a5Fa1a3A3cC3777";

export const ScanQRCodeModal: React.FC<Props> = ({
  show,
  onDismiss,
  mockResponse_DevOnly,
}) => {
  useEffect(() => {
    global.preventSecurityScreen = show;
  }, [show]);

  const topContent = <></>;
  const bottomContent = <></>;

  return (
    <Modal animationType="slide" presentationStyle="formSheet" visible={show}>
      <View style={styles.wrapper}>
        <AppHeader
          title="Scan QR code"
          headerStatusBarHeight={16}
          backgroundColor={styleguide.colors.black}
          headerLeft={
            <Button
              title="Cancel"
              onPress={() => {
                onDismiss();
              }}
            />
          }
          headerRight={
            __DEV__ ? (
              <Button
                title="(Dev) Autofill"
                onPress={() => {
                  onDismiss(mockResponse_DevOnly ?? MOCKED_ADDRESS);
                }}
              />
            ) : undefined
          }
          isModal={true}
        />
        {createQrScanner(onDismiss, topContent, bottomContent)}
      </View>
    </Modal>
  );
};

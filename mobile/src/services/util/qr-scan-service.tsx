import React from "react";
import { StyleSheet } from "react-native";
import QRCodeScanner from "react-native-qrcode-scanner";
import { styleguide } from "@react-shared";

const styles = StyleSheet.create({
  containerStyle: {
    backgroundColor: styleguide.colors.gray6_50,
  },
  cameraStyle: {
    height: "100%",
  },
});

export const createQrScanner = (
  onRead: (e: string) => void,
  topContent: string | JSX.Element,
  bottomContent: string | JSX.Element
) => {
  return (
    <QRCodeScanner
      onRead={(e) => onRead(e.data)}
      topContent={topContent}
      bottomContent={bottomContent}
      containerStyle={styles.containerStyle}
      cameraStyle={styles.cameraStyle}
    />
  );
};

import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Camera,
  useCameraDevices,
  useCodeScanner,
} from 'react-native-vision-camera';
import { styleguide } from '@react-shared';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: styleguide.colors.gray6_50,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

interface QRScannerProps {
  onRead: (value: string) => void;
  topContent: string | JSX.Element;
  bottomContent: string | JSX.Element;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onRead,
  topContent,
  bottomContent,
}) => {
  const devices = useCameraDevices();
  const device = devices.find(d => d.position === 'back');

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: codes => {
      if (codes.length > 0 && codes[0]?.value != null && codes[0].value !== '') {
        onRead(codes[0].value);
      }
    },
  });

  if (!device) {
    return (
      <View style={styles.container}>
        {topContent}
        {bottomContent}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        device={device}
        isActive={true}
        codeScanner={codeScanner}
      />
      <View style={styles.overlay}>
        {topContent}
        {bottomContent}
      </View>
    </View>
  );
};

export const createQrScanner = (
  onRead: (value: string) => void,
  topContent: string | JSX.Element,
  bottomContent: string | JSX.Element,
) => {
  return (
    <QRScanner
      onRead={onRead}
      topContent={topContent}
      bottomContent={bottomContent}
    />
  );
};

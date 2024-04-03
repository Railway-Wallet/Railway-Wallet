import React, { useEffect, useState } from 'react';
import { Modal, Platform, Text, View } from 'react-native';
import VersionNumber from 'react-native-version-number';
import { AppHeader } from '@components/headers/AppHeader/AppHeader';
import { HeaderBackButton } from '@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  showImmediateToast,
  styleguide,
  ToastType,
  useAppDispatch,
} from '@react-shared';
import { HapticSurface, triggerHaptic } from '@services/util/haptic-service';
import { getPlatformDevice } from '@services/util/platform-os-service';
import { styles } from './styles';

export type ErrorDetailsModalProps = {
  show: boolean;
  error: Error;
  onDismiss: () => void;
};

export const ErrorDetailsModal: React.FC<ErrorDetailsModalProps> = ({
  show,
  error,
  onDismiss,
}) => {
  const { appVersion } = VersionNumber;
  const dispatch = useAppDispatch();
  const platform = getPlatformDevice(Platform.OS);
  const osVersion = Platform.Version;

  const [messages, setMessages] = useState<Array<string>>([]);
  useEffect(() => {
    const newMessages = [];
    let thisErr: Error = error;
    while (thisErr?.message ?? thisErr) {
      newMessages.push(thisErr.message ?? String(thisErr));
      thisErr = thisErr?.cause as Error;
    }
    setMessages(newMessages);
  }, [error]);

  const copyErrorMessage = (message: string) => () => {
    triggerHaptic(HapticSurface.ClipboardCopy);
    Clipboard.setString(message);
    dispatch(
      showImmediateToast({
        message: 'Error message copied.',
        type: ToastType.Copy,
      }),
    );
  };

  return (
    <Modal animationType="slide" presentationStyle="formSheet" visible={show}>
      <AppHeader
        title="Error details"
        headerStatusBarHeight={16}
        backgroundColor={styleguide.colors.gray5()}
        headerLeft={<HeaderBackButton showOnAndroid customAction={onDismiss} />}
        isModal
      />
      <View key="wrapper" style={styles.wrapper}>
        <Text key="versions" style={styles.versionsText}>
          (Railway {appVersion} on {platform} {osVersion})
        </Text>
        {messages.map((message, index) => (
          <View key={index}>
            {index > 0 && <Text style={styles.causedBy}>caused by</Text>}
            <Text
              style={styles.errorMessage}
              onPress={copyErrorMessage(message)}
            >
              {message}
            </Text>
          </View>
        ))}
      </View>
    </Modal>
  );
};

import { isDefined } from "@railgun-community/shared-models";
import React from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import { ButtonTextOnly } from "@components/buttons/ButtonTextOnly/ButtonTextOnly";
import { styles } from "./styles";

export interface AlertProps {
  show?: boolean;
  title?: string;
  message?: string;
  footerView?: React.ReactNode;
  onSubmit?: () => void;
  submitTitle?: string;
}

export const GenericAlert: React.FC<AlertProps> = ({
  show = false,
  title,
  message,
  onSubmit = () => {},
  submitTitle,
  footerView,
}) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={show}
      onRequestClose={onSubmit}
    >
      <View style={styles.alertBackground}>
        <View style={styles.alertContainer}>
          {isDefined(title) && <Text style={styles.titleText}>{title}</Text>}
          <ScrollView style={styles.scrollViewContainer}>
            {isDefined(message) && (
              <Text style={styles.messageText}>{message}</Text>
            )}
            {isDefined(footerView) && footerView}
          </ScrollView>
          <ButtonTextOnly
            title={submitTitle ?? "Close"}
            onTap={onSubmit}
            labelStyle={styles.submitButtonText}
          />
        </View>
      </View>
    </Modal>
  );
};

import React from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";
import { ButtonIconOnly } from "@components/buttons/ButtonIconOnly/ButtonIconOnly";
import { styleguide } from "@react-shared";
import { Constants } from "@utils/constants";
import { styles } from "./styles";

type Props = {
  enteredPinLength: number;
  onTapPanelButton: (num: number) => void;
  onTapDecimalButton?: () => void;
  onTapBackspaceButton: () => void;
  addDecimalEntry?: boolean;
};

export const PinEntryPanel: React.FC<Props> = ({
  enteredPinLength,
  onTapPanelButton,
  onTapDecimalButton,
  onTapBackspaceButton,
  addDecimalEntry = false,
}) => {
  const numberButton = (num: number) => {
    return (
      <View style={styles.buttonWrapper}>
        <Button
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          onPress={() => onTapPanelButton(num)}
        >
          {num}
        </Button>
      </View>
    );
  };

  const decimalButton = () => {
    return (
      <View style={styles.buttonWrapper}>
        <Button
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={[styles.buttonLabel, styles.decimalLabel]}
          onPress={onTapDecimalButton}
        >
          {Constants.DECIMAL_SYMBOL}
        </Button>
      </View>
    );
  };

  const blankSpace = () => {
    return (
      <View style={styles.buttonWrapper}>
        <View style={styles.buttonContent} />
      </View>
    );
  };

  const backspaceButton = () => {
    const disabled = enteredPinLength < 1;

    return (
      <View style={styles.buttonWrapper}>
        <ButtonIconOnly
          onTap={onTapBackspaceButton}
          icon="backspace-outline"
          size={24}
          color={
            disabled
              ? styleguide.colors.labelSecondary
              : styleguide.colors.white
          }
          contentStyle={styles.buttonContent}
          disabled={disabled}
        />
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.rowWrapper}>
        {numberButton(1)}
        {numberButton(2)}
        {numberButton(3)}
      </View>
      <View style={styles.rowWrapper}>
        {numberButton(4)}
        {numberButton(5)}
        {numberButton(6)}
      </View>
      <View style={styles.rowWrapper}>
        {numberButton(7)}
        {numberButton(8)}
        {numberButton(9)}
      </View>
      <View style={styles.rowWrapper}>
        {addDecimalEntry ? decimalButton() : blankSpace()}
        {numberButton(0)}
        {backspaceButton()}
      </View>
    </View>
  );
};

import React from "react";
import { View } from "react-native";
import { IconSource } from "@views/components/icons/Icon";
import { TextEntry, TextEntryProps } from "../TextEntry/TextEntry";
import { styles } from "./styles";

interface Props extends TextEntryProps {
  invalid?: boolean;
  topBorder?: boolean;
  bottomBorder?: boolean;
  labelIcon?: IconSource;
  labelIconColor?: string;
  labelIconSize?: number;
}

export const ModalTextEntryInput: React.FC<Props> = ({
  label,
  placeholder,
  value,
  onChangeText,
  invalid = false,
  maxLength,
  useNumberPad,
  autoCapitalize = "words",
  editable = true,
  topBorder = false,
  bottomBorder = false,
  labelIcon,
  labelIconColor,
  labelIconSize,
  ...props
}) => {
  const textEntryViewStyles = [];
  if (topBorder) {
    textEntryViewStyles.push(styles.topBorder);
  }
  if (bottomBorder) {
    textEntryViewStyles.push(styles.bottomBorder);
  }
  if (invalid) {
    textEntryViewStyles.push(styles.inputInvalid);
  }

  return (
    <View style={styles.inputsWrapper}>
      <TextEntry
        viewStyles={textEntryViewStyles}
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        maxLength={maxLength}
        autoCorrect={false}
        useNumberPad={useNumberPad}
        autoCapitalize={autoCapitalize}
        editable={editable}
        labelIcon={labelIcon}
        labelIconColor={labelIconColor}
        labelIconSize={labelIconSize}
        {...props}
      />
    </View>
  );
};

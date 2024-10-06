import { isDefined } from "@railgun-community/shared-models";
import React, { ReactNode } from "react";
import { TextInput, View } from "react-native";
import { styles } from "./styles";

type Props = {
  numEntryString: string;
  placeholder: string;
  leftView: () => ReactNode;
  rightView: () => ReactNode;
  updateAmount?: (value: string) => void;
  autoFocus?: boolean;
};

export const ERC20EntryAmountButtonRow: React.FC<Props> = ({
  numEntryString,
  placeholder,
  leftView,
  updateAmount,
  rightView,
  autoFocus = true,
}) => {
  const handleOnChange = (text: string) => {
    const cleanText = text.replace(",", ".");
    updateAmount?.(cleanText);
  };

  return (
    <View style={styles.wrapper}>
      {isDefined(leftView) && leftView()}
      <TextInput
        autoFocus={autoFocus}
        value={numEntryString}
        onChangeText={handleOnChange}
        placeholder={placeholder}
        keyboardType="decimal-pad"
        inputMode="decimal"
        style={styles.input}
      />
      {rightView()}
    </View>
  );
};

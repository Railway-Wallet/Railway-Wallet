import React from "react";
import { TextStyle, ViewStyle } from "react-native";
import { Searchbar } from "react-native-paper";
import { styleguide } from "@react-shared";
import { styles } from "./styles";

interface SearchProps {
  value: string;
  onUpdateQuery: (value: string) => void;
  placeholder?: string;
  viewStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const SearchEntry: React.FC<SearchProps> = ({
  value,
  onUpdateQuery,
  placeholder = "Search",
  viewStyle = {},
  inputStyle = {},
}) => {
  return (
    <Searchbar
      style={[styles.searchbar, viewStyle]}
      value={value}
      onChangeText={onUpdateQuery}
      placeholder={placeholder}
      inputStyle={[styles.searchbarInput, inputStyle]}
      iconColor={styleguide.colors.labelSecondary}
      placeholderTextColor={styleguide.colors.labelSecondary}
      autoCorrect={false}
      spellCheck={false}
      autoCapitalize="none"
    />
  );
};

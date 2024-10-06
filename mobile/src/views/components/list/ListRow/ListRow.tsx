import { isDefined } from "@railgun-community/shared-models";
import React, { ReactNode } from "react";
import { StyleProp, TextStyle, View, ViewStyle } from "react-native";
import { ListItem } from "@components/list/ListItem/ListItem";
import { styleguide } from "@react-shared";
import { styles } from "./styles";

type Props = {
  title: string | ReactNode;
  description?: string | ReactNode;
  defaultNoBorder?: boolean;
  backgroundColor?: string;
  selected?: boolean;
  disabled?: boolean;
  rightView?: () => ReactNode;
  leftView?: () => ReactNode;
  onSelect?: () => void;
  multilineTitle?: boolean;
  centerStyle?: StyleProp<ViewStyle>;
  descriptionStyle?: StyleProp<TextStyle>;
  rightStyle?: StyleProp<ViewStyle>;
  error?: boolean;
  descriptionNumberOfLines?: number;
  descriptionAdjustsFontSizeToFit?: boolean;
};

export const ListRow: React.FC<Props> = ({
  title,
  description,
  backgroundColor,
  defaultNoBorder = false,
  selected = false,
  disabled = false,
  onSelect,
  rightView,
  leftView,
  multilineTitle = false,
  descriptionNumberOfLines = 1,
  descriptionAdjustsFontSizeToFit = true,
  centerStyle,
  rightStyle,
  descriptionStyle,
  error = false,
}) => {
  return (
    <View
      style={[
        styles.rowWrapper,
        defaultNoBorder ? {} : { borderColor: styleguide.colors.gray5() },
        error ? styles.errorBorder : {},
        selected ? styles.selectedWrapper : {},
        disabled ? styles.disabledWrapper : {},
        isDefined(backgroundColor) ? { backgroundColor } : {},
      ]}
    >
      <ListItem
        title={title}
        descriptionAdjustsFontSizeToFit={descriptionAdjustsFontSizeToFit}
        descriptionNumberOfLines={descriptionNumberOfLines}
        description={description}
        disabled={disabled}
        onPress={onSelect}
        rightView={rightView}
        leftView={leftView}
        centerStyle={centerStyle}
        rightStyle={rightStyle}
        titleStyle={styles.titleStyle}
        descriptionStyle={[styles.descriptionStyle, descriptionStyle]}
        titleNumberOfLines={multilineTitle ? 2 : 1}
        testID="ListRow-Item"
      />
    </View>
  );
};

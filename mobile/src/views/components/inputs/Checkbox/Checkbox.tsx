import { isDefined } from "@railgun-community/shared-models";
import React from "react";
import {
  StyleProp,
  Text,
  TextProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { styleguide } from "@react-shared";
import { COMMON_HIT_SLOP } from "@utils/constants";
import { Icon } from "@views/components/icons/Icon";
import { styles } from "./styles";

interface Props {
  onPress?: () => void;
  selected: boolean;
  label?: string;
  testID?: string;
  labelProps?: TextProps;
  style?: StyleProp<ViewStyle>;
  rightView?: React.ReactNode;
}

export function Checkbox({
  onPress,
  rightView,
  selected,
  label,
  testID,
  labelProps,
  style,
}: Props) {
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        testID={testID}
        activeOpacity={0.5}
        onPress={onPress}
        style={[styles.checkboxContainer, style]}
        hitSlop={COMMON_HIT_SLOP}
      >
        <View style={styles.checkbox}>
          {selected && (
            <View style={styles.iconContainer}>
              <Icon
                source="check-bold"
                size={18}
                color={styleguide.colors.white}
              />
            </View>
          )}
        </View>
        {isDefined(label) && (
          <Text
            {...labelProps}
            style={[
              styles.label,
              isDefined(labelProps) &&
                isDefined(labelProps?.style) &&
                labelProps.style,
            ]}
          >
            {label}
          </Text>
        )}
      </TouchableOpacity>
      {isDefined(rightView) && rightView}
    </View>
  );
}

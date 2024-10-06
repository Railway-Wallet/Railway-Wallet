import { isDefined } from "@railgun-community/shared-models";
import React, { ReactNode } from "react";
import {
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { isAndroid } from "@services/util/platform-os-service";
import { styles } from "./styles";

type Props = {
  title: string | ReactNode;
  titleStyle?: StyleProp<TextStyle>;
  titleNumberOfLines?: number;
  titleAdjustsFontSizeToFit?: boolean;
  description?: string | ReactNode;
  descriptionStyle?: StyleProp<TextStyle>;
  descriptionNumberOfLines?: number;
  descriptionAdjustsFontSizeToFit?: boolean;
  centerStyle?: StyleProp<ViewStyle>;
  rightStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  testID?: string;
  onPress?: () => void;
  rightView?: () => ReactNode;
  leftView?: () => ReactNode;
};

export const ListItem: React.FC<Props> = ({
  title,
  titleStyle,
  titleNumberOfLines,
  titleAdjustsFontSizeToFit,
  description,
  descriptionStyle,
  descriptionNumberOfLines,
  descriptionAdjustsFontSizeToFit,
  centerStyle,
  rightStyle,
  style,
  disabled = false,
  testID,
  onPress,
  rightView,
  leftView,
}) => {
  const handleOnPress = () => {
    if (onPress && !disabled) {
      onPress();
    }
  };

  const renderText = (
    text: string | ReactNode,
    style: StyleProp<TextStyle>,
    numberOfLines?: number,
    adjustsFontSizeToFit: boolean = false
  ) => {
    if (typeof text === "string") {
      return (
        <Text
          style={style}
          numberOfLines={numberOfLines}
          adjustsFontSizeToFit={adjustsFontSizeToFit && !isAndroid()}
        >
          {text}
        </Text>
      );
    }
    return text;
  };

  return (
    <TouchableOpacity testID={testID} onPress={handleOnPress}>
      <View style={[styles.listItemContainer, style]}>
        {leftView && <View style={styles.leftViewContainer}>{leftView()}</View>}
        <View style={styles.centerAndRightViewContainer}>
          <View style={[styles.centerViewContainer, centerStyle]}>
            {isDefined(title) &&
              renderText(
                title,
                [styles.defaultTitleStyle, titleStyle],
                titleNumberOfLines,
                titleAdjustsFontSizeToFit
              )}
            {isDefined(description) &&
              renderText(
                description,
                [styles.defaultDescriptionStyle, descriptionStyle],
                descriptionNumberOfLines,
                descriptionAdjustsFontSizeToFit
              )}
          </View>
          {rightView && (
            <View style={[styles.rightViewContainer, rightStyle]}>
              {rightView()}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

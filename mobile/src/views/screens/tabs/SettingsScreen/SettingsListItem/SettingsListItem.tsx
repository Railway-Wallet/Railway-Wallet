import { isDefined } from "@railgun-community/shared-models";
import React from "react";
import { StyleProp, Text, TextStyle, View, ViewStyle } from "react-native";
import { Icon, IconSource } from "@components/icons/Icon";
import { ListItem } from "@components/list/ListItem/ListItem";
import { styleguide } from "@react-shared";
import { styles } from "./styles";

type Props = {
  title: string;
  titleIcon?: IconSource;
  description?: string;
  icon?: IconSource;
  iconColor?: string;
  onTap?: () => void;
  titleStyle?: TextStyle;
  centerStyle?: StyleProp<ViewStyle>;
  descriptionNumberOfLines?: number;
  descriptionStyle?: TextStyle;
  rightView?: () => JSX.Element;
};

export const SettingsListItem: React.FC<Props> = ({
  title,
  titleIcon,
  description,
  icon,
  iconColor,
  centerStyle,
  onTap,
  titleStyle,
  descriptionStyle,
  descriptionNumberOfLines,
  rightView: customRightView,
}) => {
  const rightView = () =>
    isDefined(icon) && (
      <View style={styles.rightIconWrapper}>
        <Icon
          source={icon}
          size={24}
          color={iconColor ?? styleguide.colors.labelSecondary}
        />
      </View>
    );

  const titleView = (
    <View style={styles.titleContainerStyle}>
      <Text style={[styles.titleStyle, titleStyle]}>{title}</Text>
      {isDefined(titleIcon) && (
        <View style={styles.titleIcon}>
          <Icon
            source={titleIcon}
            size={18}
            color={styleguide.colors.txGreen()}
          />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.rowWrapper}>
      <ListItem
        onPress={onTap}
        style={styles.listItem}
        descriptionStyle={[styles.descriptionStyle, descriptionStyle]}
        title={titleView}
        description={description}
        descriptionNumberOfLines={descriptionNumberOfLines}
        rightView={customRightView ?? rightView}
        centerStyle={centerStyle}
        testID="SettingsListItem-Item"
      />
    </View>
  );
};

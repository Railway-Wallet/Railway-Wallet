import { isDefined } from "@railgun-community/shared-models";
import React, { ReactNode, useCallback } from "react";
import { StyleProp, Text, TextStyle, View, ViewStyle } from "react-native";
import { ListItem } from "@components/list/ListItem/ListItem";
import { styleguide } from "@react-shared";
import { Icon } from "@views/components/icons/Icon";
import { styles } from "./styles";

type Props = {
  title: string;
  titleIconSource?: string;
  description?: string;
  rightText?: string;
  rightSubtext?: string;
  onTap: () => void;
  showTopBorder?: boolean;
  showBottomBorder?: boolean;
  disabled?: boolean;
  hideRightIcon?: boolean;
  titleStyle?: StyleProp<TextStyle>;
  rightIconSource?: string;
  containerStyle?: StyleProp<ViewStyle>;
  descriptionStyle?: StyleProp<TextStyle>;
  customRightView?: ReactNode;
};

export const SelectableListItem: React.FC<Props> = ({
  title,
  titleIconSource,
  description,
  rightText,
  rightSubtext,
  onTap,
  showTopBorder = false,
  showBottomBorder = false,
  disabled = false,
  rightIconSource,
  hideRightIcon = false,
  containerStyle,
  titleStyle,
  descriptionStyle,
  customRightView,
}) => {
  const titleView = (
    <View style={styles.headerTextWrapper}>
      <Text style={[styles.titleStyle, titleStyle]}>{title}</Text>
      {isDefined(titleIconSource) && (
        <View style={styles.headerIcon}>
          <Icon
            source={titleIconSource}
            size={16}
            color={styleguide.colors.gray7()}
          />
        </View>
      )}
    </View>
  );

  const rightView = useCallback(() => {
    if (isDefined(customRightView)) {
      return customRightView;
    }

    return (
      <View style={styles.rightWrapper}>
        <View style={styles.rightTextWrapper}>
          <Text
            style={styles.rightText}
            numberOfLines={3}
            testID="SelectableListItem-RightText"
          >
            {rightText}
          </Text>
          {isDefined(rightSubtext) && (
            <Text style={styles.rightSubtext}>{rightSubtext}</Text>
          )}
        </View>
        {!disabled && !hideRightIcon && (
          <Icon
            source={rightIconSource ?? "chevron-right"}
            size={24}
            color={styleguide.colors.labelSecondary}
          />
        )}
      </View>
    );
  }, [
    disabled,
    hideRightIcon,
    rightSubtext,
    rightText,
    rightIconSource,
    customRightView,
  ]);

  return (
    <View
      style={[
        styles.rowWrapper,
        showTopBorder ? styles.showTopBorder : undefined,
        showBottomBorder ? styles.showBottomBorder : undefined,
        containerStyle,
      ]}
    >
      <ListItem
        onPress={onTap}
        disabled={disabled}
        style={styles.listItem}
        rightStyle={styles.rightView}
        title={titleView}
        description={description}
        descriptionStyle={[styles.leftDescriptionStyle, descriptionStyle]}
        rightView={rightView}
        testID="SelectableListItem-Item"
      />
    </View>
  );
};

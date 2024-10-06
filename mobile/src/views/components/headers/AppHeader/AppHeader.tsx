import { isDefined } from "@railgun-community/shared-models";
import React, { ReactNode, useState } from "react";
import { Text, View } from "react-native";
import {
  Header as NativeHeader,
  HeaderTitleProps,
} from "@react-navigation/elements";
import { styleguide } from "@react-shared";
import { styles } from "./styles";

export type AppHeaderProps = {
  title?: string;
  isModal?: boolean;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  backgroundColor?: string;
  headerTransparent?: boolean;
  headerStatusBarHeight?: number;
  onPressTitle?: () => void;
  allowFontScaling?: boolean;
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  title = "",
  isModal = false,
  headerLeft,
  headerRight,
  backgroundColor,
  headerStatusBarHeight,
  onPressTitle,
  allowFontScaling,
}) => {
  const [hoverTitle, setHoverTitle] = useState(false);

  const titleView = (props: HeaderTitleProps) => {
    return (
      <Text
        allowFontScaling={props.allowFontScaling}
        style={Object.assign(
          {},
          styles.title,
          hoverTitle ? styles.hoveredTitle : {}
        )}
        onPressIn={() => setHoverTitle(true)}
        onPressOut={() => setHoverTitle(false)}
        onPress={onPressTitle}
      >
        {props.children}
      </Text>
    );
  };

  const headerButtonWithModalPadding = (node?: ReactNode) => {
    if (!isDefined(node)) {
      return null;
    }
    if (!isModal) {
      return node;
    }
    return <View style={styles.headerButtonPadding}>{node}</View>;
  };

  return (
    <NativeHeader
      title={title}
      headerTitle={(props) => titleView({ ...props, allowFontScaling })}
      modal={isModal}
      headerStyle={[
        styles.headerStyle,
        isDefined(backgroundColor) ? { backgroundColor } : null,
      ]}
      headerTintColor={styleguide.colors.text()}
      headerRight={() => headerButtonWithModalPadding(headerRight)}
      headerLeft={() => headerButtonWithModalPadding(headerLeft)}
      headerStatusBarHeight={headerStatusBarHeight}
    />
  );
};

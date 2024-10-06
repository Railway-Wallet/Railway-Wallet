import { isDefined } from "@railgun-community/shared-models";
import React from "react";
import { Text, View } from "react-native";
import { styleguide } from "@react-shared";
import { Icon, IconSource } from "@views/components/icons/Icon";
import { styles } from "./styles";

type Props = {
  text: string;
  rightView?: React.ReactNode;
  titleIconSource?: IconSource;
};

export const ListHeader: React.FC<Props> = ({
  text,
  rightView,
  titleIconSource,
}) => {
  return (
    <View style={styles.headerWrapper}>
      <View style={styles.headerTextWrapper}>
        <Text style={styles.headerText} testID="ListHeader-Text">
          {text}
        </Text>
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
      {rightView}
    </View>
  );
};

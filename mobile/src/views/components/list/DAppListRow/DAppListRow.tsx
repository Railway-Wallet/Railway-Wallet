import React from "react";
import { Image, ImageSourcePropType, View } from "react-native";
import { styleguide } from "@react-shared";
import { Icon } from "@views/components/icons/Icon";
import { ListRow } from "../ListRow/ListRow";
import { styles } from "./styles";

type Props = {
  title: string;
  description: string;
  icon: ImageSourcePropType | string;
  onSelect: () => void;
  defaultNoBorder?: boolean;
  disabled?: boolean;
};

export const DAppListRow: React.FC<Props> = ({
  title,
  description,
  icon,
  defaultNoBorder,
  disabled,
  onSelect,
}) => {
  const leftView = () => {
    const isIconLabel = typeof icon === "string";
    return (
      <View style={styles.dAppIconWrapper}>
        <View style={styles.dAppIconBackground}>
          {isIconLabel ? (
            <Icon source={icon} size={32} color={styleguide.colors.white} />
          ) : (
            <Image source={icon} style={styles.dAppImage} />
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.rowWrapper}>
      <ListRow
        title={title}
        description={description}
        defaultNoBorder={defaultNoBorder}
        descriptionAdjustsFontSizeToFit={false}
        disabled={disabled}
        leftView={leftView}
        onSelect={onSelect}
        centerStyle={styles.centerStyle}
        descriptionNumberOfLines={2}
        multilineTitle
      />
    </View>
  );
};

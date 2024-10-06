import React from "react";
import { Image, ImageSourcePropType, ImageStyle, View } from "react-native";
import { styles } from "./styles";

type Props = {
  source: ImageSourcePropType;
  alignLeft?: boolean;
  additionalStyles?: ImageStyle;
};

export const HeaderImage: React.FC<Props> = ({
  source,
  alignLeft = false,
  additionalStyles,
}) => {
  return (
    <View style={styles.logoWrapper}>
      <Image
        source={source}
        style={[
          styles.logoImage,
          // eslint-disable-next-line react-native/no-inline-styles
          { alignSelf: alignLeft ? "flex-start" : "center" },
          additionalStyles,
        ]}
      />
    </View>
  );
};

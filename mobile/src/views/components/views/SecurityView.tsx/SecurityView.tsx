import React from "react";
import { Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SwirlBackground } from "@components/images/SwirlBackground/SwirlBackground";
import { ImageSwirl } from "@react-shared";
import { imageHeightFromDesiredWidth } from "@utils/image-utils";
import { styles } from "./styles";

type Props = {};

export const SecurityView: React.FC<React.PropsWithChildren<Props>> = ({
  children,
}) => {
  const windowWidth = Dimensions.get("window").width;
  const swirlWidth = windowWidth * 0.96;
  const swirlHeight = imageHeightFromDesiredWidth(ImageSwirl(), swirlWidth);

  return (
    <SafeAreaView style={styles.wrapper}>
      <SwirlBackground
        style={{
          ...styles.swirlBackground,
          width: swirlWidth,
          height: swirlHeight,
        }}
      />
      {children}
    </SafeAreaView>
  );
};

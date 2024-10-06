import React from "react";
import { Image, ImageSourcePropType, View } from "react-native";
import loading from "@assets/animations/loading.gif";
import { isAndroid } from "@services/util/platform-os-service";
import { SpinnerCubes } from "../SpinnerCubes/SpinnerCubes";
import { styles } from "./styles";

export const LoadingSwirl: React.FC = () => {
  return (
    <View style={styles.loadingContainer}>
      {isAndroid() ? (
        <SpinnerCubes size={24} style={styles.spinner} />
      ) : (
        <Image
          source={loading as ImageSourcePropType}
          style={styles.loading}
          resizeMode="contain"
        />
      )}
    </View>
  );
};

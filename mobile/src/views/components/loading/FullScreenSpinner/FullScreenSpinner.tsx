import { isDefined } from "@railgun-community/shared-models";
import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { styleguide } from "@react-shared";
import { AnimatedWrapper } from "@services/animation/AnimatedWrapper";
import { styles } from "./styles";

export type FullScreenSpinnerProps = {
  show: boolean;
  text?: string;
  preventTouch?: boolean;
};

export const FullScreenSpinner: React.FC<FullScreenSpinnerProps> = ({
  show,
  text,
  preventTouch = true,
}) => {
  const fadeAnim = useRef(new AnimatedWrapper.Value(0)).current;

  const onLoad = () => {
    AnimatedWrapper.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const onDismiss = () => {
    AnimatedWrapper.timing(fadeAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (show) {
      onLoad();
    } else {
      onDismiss();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const shouldPreventTouch = show && preventTouch;

  return (
    <View
      style={styles.container}
      pointerEvents={shouldPreventTouch ? "auto" : "none"}
    >
      <AnimatedWrapper.View
        style={{ ...styles.spinnerContainer, opacity: fadeAnim }}
      >
        <ActivityIndicator size="large" color={styleguide.colors.white} />
        {isDefined(text) && (
          <Text style={styles.text} testID="FullScreenSpinner-Text">
            {text}
          </Text>
        )}
      </AnimatedWrapper.View>
    </View>
  );
};

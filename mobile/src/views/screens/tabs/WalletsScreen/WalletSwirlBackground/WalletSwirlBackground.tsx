import React from "react";
import { Animated } from "react-native";
import { SwirlBackground } from "@components/images/SwirlBackground/SwirlBackground";
import { SWIRL_DEFAULT_WIDTH_PCT } from "@components/images/SwirlBackground/styles";

type Props = {
  animate: boolean;
};

const ANIMATION_DURATION = 300;

export const WalletSwirlBackground: React.FC<Props> = ({ animate }) => {
  const widthPct = new Animated.Value(0);

  if (animate) {
    Animated.loop(
      Animated.sequence([
        Animated.timing(widthPct, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }),
        Animated.timing(widthPct, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }),
      ])
    ).start();
  } else {
    Animated.timing(widthPct, {
      toValue: 0,
      duration: ANIMATION_DURATION,
      useNativeDriver: false,
    }).start();
  }

  return (
    <Animated.View
      // eslint-disable-next-line react-native/no-inline-styles
      style={{
        position: "absolute",
        top: 0,
        width: widthPct.interpolate({
          inputRange: [0, 1],
          outputRange: [
            SWIRL_DEFAULT_WIDTH_PCT + "%",
            SWIRL_DEFAULT_WIDTH_PCT * 1.05 + "%",
          ],
        }),
        height: 75,
      }}
    >
      {/* eslint-disable-next-line react-native/no-inline-styles */}
      <SwirlBackground style={{ width: "100%", marginTop: 12 }} />
    </Animated.View>
  );
};

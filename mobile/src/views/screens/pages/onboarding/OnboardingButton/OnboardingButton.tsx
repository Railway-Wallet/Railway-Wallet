import React from "react";
import { ImageSourcePropType, Pressable } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import chevron from "@assets/img/chevron-right.png";
import { styles } from "./styles";

type Props = {
  currentIndex: SharedValue<number>;
  length: number;
  handleSubmit: () => void;
};
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const OnboardingButton = ({
  currentIndex,
  length,
  handleSubmit,
}: Props) => {
  const rnBtnStyle = useAnimatedStyle(() => {
    return {
      width:
        currentIndex.value === length - 1 ? withSpring(140) : withSpring(60),
      height: 60,
    };
  }, [currentIndex, length]);

  const rnTextStyle = useAnimatedStyle(() => {
    return {
      opacity:
        currentIndex.value === length - 1 ? withTiming(1) : withTiming(0),
      transform: [
        {
          translateX:
            currentIndex.value === length - 1 ? withTiming(0) : withTiming(100),
        },
      ],
    };
  }, [currentIndex, length]);

  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity:
        currentIndex.value !== length - 1 ? withTiming(1) : withTiming(0),
      transform: [
        {
          translateX:
            currentIndex.value !== length - 1 ? withTiming(0) : withTiming(100),
        },
      ],
    };
  }, [currentIndex, length]);

  return (
    <AnimatedPressable
      style={[styles.container, rnBtnStyle]}
      onPress={handleSubmit}
    >
      <Animated.Text style={[styles.textStyle, rnTextStyle]}>
        Let's go!
      </Animated.Text>
      <Animated.Image
        source={chevron as ImageSourcePropType}
        resizeMode="contain"
        style={[styles.imageStyle, imageAnimatedStyle]}
      />
    </AnimatedPressable>
  );
};

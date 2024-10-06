import React from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { styles } from "./styles";

type Props = {
  length: number;
  x: SharedValue<number>;
};

const PaginationComponent = ({
  index,
  x,
}: {
  index: number;
  x: SharedValue<number>;
}) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const itemRnStyle = useAnimatedStyle(() => {
    const width = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [35, 16, 35],
      Extrapolation.CLAMP
    );

    const bgColor = interpolateColor(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      ["#D0D0D0", "rgb(55, 55, 55)", "#D0D0D0"]
    );

    return {
      width,
      backgroundColor: bgColor,
    };
  }, [x]);

  return <Animated.View style={[styles.itemStyle, itemRnStyle]} />;
};

export const PaginationElement = ({ length, x }: Props) => {
  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => {
        return <PaginationComponent index={index} key={index} x={x} />;
      })}
    </View>
  );
};

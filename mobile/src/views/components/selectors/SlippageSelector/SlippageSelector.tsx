import React from "react";
import { Text, View } from "react-native";
import Slider from "@react-native-community/slider";
import { styleguide } from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { styles } from "./styles";

type Props = {
  slippagePercentage: number;
  slippageDisclaimer: string;
  setSlippagePercentage: React.Dispatch<React.SetStateAction<number>>;
};

export const SlippageSelector: React.FC<Props> = ({
  slippageDisclaimer,
  setSlippagePercentage,
  slippagePercentage,
}) => {
  return (
    <View style={styles.content}>
      <Text style={styles.sectionHeader}>
        Slippage: {(slippagePercentage * 100).toFixed(1)} %
      </Text>
      <View style={styles.sliderContainer}>
        <Slider
          value={slippagePercentage}
          minimumValue={0.001}
          maximumValue={0.2}
          step={0.001}
          onValueChange={(value: number) => {
            const wholeValue = Math.round(value * 100);
            const valueToOneTenth = Math.round(value * 1000) / 10;
            if (wholeValue === valueToOneTenth) {
              triggerHaptic(HapticSurface.Slider);
            }
            setSlippagePercentage(valueToOneTenth / 100);
          }}
          maximumTrackTintColor={styleguide.colors.gray2()}
        />
      </View>
      <Text style={styles.slippageDisclaimer}>{slippageDisclaimer}</Text>
    </View>
  );
};

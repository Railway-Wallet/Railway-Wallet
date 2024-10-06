import React from "react";
import { View } from "react-native";
import { styles } from "./styles";

type Props = {
  enteredPinLength: number;
};

export const PinEntryDots: React.FC<Props> = ({ enteredPinLength }) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.pinDots}>
        <View style={styles.pinDotWrapper}>
          <View
            style={[
              styles.pinDot,
              enteredPinLength > 0
                ? styles.pinDotSelected
                : styles.pinDotUnselected,
            ]}
          />
        </View>
        <View style={styles.pinDotWrapper}>
          <View
            style={[
              styles.pinDot,
              enteredPinLength > 1
                ? styles.pinDotSelected
                : styles.pinDotUnselected,
            ]}
          />
        </View>
        <View style={styles.pinDotWrapper}>
          <View
            style={[
              styles.pinDot,
              enteredPinLength > 2
                ? styles.pinDotSelected
                : styles.pinDotUnselected,
            ]}
          />
        </View>
        <View style={styles.pinDotWrapper}>
          <View
            style={[
              styles.pinDot,
              enteredPinLength > 3
                ? styles.pinDotSelected
                : styles.pinDotUnselected,
            ]}
          />
        </View>
        <View style={styles.pinDotWrapper}>
          <View
            style={[
              styles.pinDot,
              enteredPinLength > 4
                ? styles.pinDotSelected
                : styles.pinDotUnselected,
            ]}
          />
        </View>
        <View style={styles.pinDotWrapper}>
          <View
            style={[
              styles.pinDot,
              enteredPinLength > 5
                ? styles.pinDotSelected
                : styles.pinDotUnselected,
            ]}
          />
        </View>
      </View>
    </View>
  );
};

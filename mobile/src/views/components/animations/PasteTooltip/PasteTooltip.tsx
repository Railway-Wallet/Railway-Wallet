import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useClickOutside } from "react-native-click-outside";
import Clipboard from "@react-native-clipboard/clipboard";
import { styles } from "./styles";

const TOAST_ANIMATION_SPEED = 200;

type Props = {
  visibilityPasteTooltip: boolean;
  onPaste: (value: string) => void;
  customStyle?: StyleProp<ViewStyle>;
  customPointerStyle?: StyleProp<ViewStyle>;
  setVisibilityPasteTooltip: (value: boolean) => void;
};

export const PasteTooltip: React.FC<Props> = ({
  onPaste,
  customStyle,
  customPointerStyle,
  visibilityPasteTooltip,
  setVisibilityPasteTooltip,
}) => {
  const ref = useClickOutside<View>(() => {
    setVisibilityPasteTooltip(false);
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const startAnimation = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: TOAST_ANIMATION_SPEED,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    if (visibilityPasteTooltip) {
      startAnimation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibilityPasteTooltip]);

  if (!visibilityPasteTooltip) {
    return null;
  }

  const handlePasteFromClipboard = async () => {
    const valueFromClipboard = await Clipboard.getString();
    onPaste(valueFromClipboard);
    setVisibilityPasteTooltip(false);
  };

  return (
    <Animated.View
      ref={ref}
      style={[styles.animationContainer, customStyle, { opacity: fadeAnim }]}
    >
      <TouchableOpacity onPress={handlePasteFromClipboard}>
        <Text style={styles.text}>Paste</Text>
        <View style={[styles.pointer, customPointerStyle]} />
      </TouchableOpacity>
    </Animated.View>
  );
};

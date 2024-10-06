import { isDefined } from "@railgun-community/shared-models";
import React, { useState } from "react";
import { Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { RailgunGradient } from "@components/gradient/RailgunGradient";
import {
  CalloutType,
  IconPublic,
  IconShielded,
  styleguide,
} from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { Icon, IconSource } from "@views/components/icons/Icon";
import { styles } from "./styles";

type Props = {
  type: CalloutType;
  text: string;
  style?: ViewStyle;
  borderColor?: string;
  gradientColors?: string[];
  ctaButton?: string;
  onCtaPress?: () => void;
  expandable?: boolean;
};

export const InfoCallout: React.FC<Props> = ({
  type,
  text,
  style,
  borderColor,
  gradientColors,
  ctaButton,
  onCtaPress,
  expandable = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  let icon: IconSource = "information-outline";
  switch (type) {
    case CalloutType.Info: {
      icon = "information-outline";
      break;
    }
    case CalloutType.Help: {
      icon = "help-circle-outline";
      break;
    }
    case CalloutType.Warning: {
      icon = "alert-octagram";
      break;
    }
    case CalloutType.Secure: {
      icon = IconShielded();
      break;
    }
    case CalloutType.Insecure: {
      icon = IconPublic();
      break;
    }
    case CalloutType.Unlock: {
      icon = "lock-open-outline";
      break;
    }
    case CalloutType.Create: {
      icon = "plus";
      break;
    }
  }

  const ctaButtonText = () => {
    return (
      isDefined(ctaButton) &&
      onCtaPress && (
        <Text
          style={styles.ctaButton}
          onPress={onCtaPress}
          numberOfLines={1}
          testID="InfoCallout-ctaButton"
        >
          {ctaButton}
        </Text>
      )
    );
  };

  const onPress = () => {
    if (!expandable) {
      return;
    }

    triggerHaptic(HapticSurface.SelectItem);
    setExpanded(!expanded);
  };

  const content = () => {
    return (
      <>
        <Icon color={styleguide.colors.text()} source={icon} size={24} />
        <Text style={styles.text} testID="InfoCallout-Text">
          {text} {ctaButtonText()}
        </Text>
      </>
    );
  };

  const expandableContent = () => {
    if (expanded) {
      return content();
    }

    return (
      <>
        <Icon color={styleguide.colors.text()} source={icon} size={24} />
        <Text
          style={[styles.text, styles.textUnexpanded]}
          testID="InfoCallout-Text"
        >
          Tap for more information
        </Text>
      </>
    );
  };

  const railgunGradientWrapper = () => {
    return (
      <RailgunGradient style={styles.border}>
        <RailgunGradient
          style={styles.content}
          gradient={styleguide.colors.gradients.railgunDark}
        >
          {expandable ? expandableContent() : content()}
        </RailgunGradient>
      </RailgunGradient>
    );
  };

  const solidBorderWrapper = () => {
    const gradientStyles = {
      ...styleguide.colors.gradients.railgun,
      colors: gradientColors ?? [],
    };

    return (
      <View style={[styles.border, { backgroundColor: borderColor }]}>
        <RailgunGradient style={styles.content} gradient={gradientStyles}>
          {expandable ? expandableContent() : content()}
        </RailgunGradient>
      </View>
    );
  };

  const viewContent = () => {
    return isDefined(borderColor) && gradientColors
      ? solidBorderWrapper()
      : railgunGradientWrapper();
  };

  return expandable ? (
    <TouchableOpacity
      style={[styles.infoAlertWrapper, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {viewContent()}
    </TouchableOpacity>
  ) : (
    <View style={[styles.infoAlertWrapper, style]}>{viewContent()}</View>
  );
};

import React from "react";
import { Text, View } from "react-native";
import { Button } from "react-native-paper";
import {
  GradientStyle,
  RailgunGradient,
} from "@components/gradient/RailgunGradient";
import {
  getNetworkFrontendConfig,
  styleguide,
  useReduxSelector,
} from "@react-shared";
import { styles } from "./styles";

type Props = {
  isRailgun: boolean;
  onTap: () => void;
};

export const PublicPrivateSelector: React.FC<Props> = ({
  onTap,
  isRailgun,
}) => {
  const { network } = useReduxSelector("network");

  const frontendConfig = getNetworkFrontendConfig(network.current.name);

  const gradientStyle: Optional<GradientStyle> = isRailgun
    ? undefined
    : {
        ...styleguide.colors.gradients.railgun,
        colors: frontendConfig.gradientColors,
      };

  return (
    <View style={styles.buttonWrapper}>
      <RailgunGradient style={styles.gradientBorder} gradient={gradientStyle}>
        <Button
          onPress={onTap}
          textColor={styleguide.colors.text()}
          style={styles.buttonStyle}
          contentStyle={styles.buttonContent}
        >
          <Text style={styles.buttonText}>
            {isRailgun ? "Private" : "Public"}
          </Text>
        </Button>
      </RailgunGradient>
    </View>
  );
};

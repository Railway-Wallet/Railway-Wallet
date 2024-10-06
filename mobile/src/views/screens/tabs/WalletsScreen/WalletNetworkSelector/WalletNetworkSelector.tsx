import React from "react";
import { Text, View } from "react-native";
import { Button } from "react-native-paper";
import { styleguide, useReduxSelector } from "@react-shared";
import { navBarStyles, standardStyles } from "./styles";

type Props = {
  onTap: () => void;
  isNavBar?: boolean;
};

export const WalletNetworkSelector: React.FC<Props> = ({
  onTap,
  isNavBar = false,
}) => {
  const { network } = useReduxSelector("network");

  const styles = isNavBar ? navBarStyles : standardStyles;

  return (
    <View style={styles.buttonWrapper}>
      <Button
        onPress={onTap}
        icon="chevron-right"
        textColor={styleguide.colors.text()}
        style={styles.buttonStyle}
        labelStyle={styles.buttonIcon}
        contentStyle={styles.buttonContent}
      >
        <Text style={styles.buttonText}>{network.current.shortPublicName}</Text>
      </Button>
    </View>
  );
};

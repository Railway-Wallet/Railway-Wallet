import React from "react";
import { View } from "react-native";
import { WideButtonTextOnly } from "@components/buttons/WideButtonTextOnly/WideButtonTextOnly";
import { isAndroid } from "@services/util/platform-os-service";
import { styles } from "./styles";

type Props = {
  buttonTitle: string;
  buttonAction: () => void;
  disabled?: boolean;
  showBackground?: boolean;
};

export const FooterButtonAndroid: React.FC<Props> = ({
  buttonTitle,
  buttonAction,
  disabled,
  showBackground = true,
}) => {
  if (!isAndroid()) {
    return null;
  }
  return (
    <View
      style={[
        styles.footer,
        showBackground ? styles.optionalFooterBackground : undefined,
      ]}
    >
      <WideButtonTextOnly
        title={buttonTitle}
        onPress={buttonAction}
        disabled={disabled}
      />
    </View>
  );
};

import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./styles";

type Props = {
  children?: React.ReactNode;
};

export const SafeGrayFooter: React.FC<Props> = ({ children }) => {
  return (
    <SafeAreaView style={styles.footer} edges={["bottom"]}>
      {children}
    </SafeAreaView>
  );
};

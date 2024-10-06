import React from "react";
import { Text, View } from "react-native";
import { styles } from "./styles";

type Props = {
  title: string;
};

export const SettingsListHeader: React.FC<Props> = ({ title }) => {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.text}>{title}</Text>
    </View>
  );
};

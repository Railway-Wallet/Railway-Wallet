import React from "react";
import { Text, View } from "react-native";
import { SpinnerCubes } from "../../../../../components/loading/SpinnerCubes/SpinnerCubes";
import { styles } from "./styles";

type Props = {
  title: string;
  progress: number;
};

export const ERC20TokenListLoading: React.FC<Props> = ({ title, progress }) => {
  const percentage = (progress * 100).toFixed(0);

  return (
    <View style={styles.container}>
      <SpinnerCubes size={12} style={styles.spinner} />
      <Text style={styles.text}>
        {title}: {percentage}%
      </Text>
    </View>
  );
};

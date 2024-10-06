import React from "react";
import { View } from "react-native";
import { Toast } from "@components/alerts/Toast/Toast";
import { useReduxSelector } from "@react-shared";
import { styles } from "./styles";

type Props = {};

export const ToastWrapperView: React.FC<Props> = () => {
  const { toast } = useReduxSelector("toast");

  return (
    <View style={styles.toastsWrapper}>
      {toast.immediate && (
        <Toast {...toast.immediate} isImmediate={true} duration={3500} />
      )}
      {toast.asyncQueue.length > 0 && (
        <Toast {...toast.asyncQueue[0]} isImmediate={false} duration={5000} />
      )}
    </View>
  );
};

import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import React from "react";
import { InfoCallout } from "@components/callouts/InfoCallout/InfoCallout";
import { useWalletCallout } from "@react-shared";
import { styles } from "./styles";

type Props = {
  balanceBucketFilter: RailgunWalletBalanceBucket[];
};

export const WalletInfoCallout: React.FC<Props> = ({ balanceBucketFilter }) => {
  const { text, calloutType } = useWalletCallout(balanceBucketFilter);
  if (!isDefined(text) || text === "" || !calloutType) {
    return null;
  }

  return (
    <InfoCallout type={calloutType} text={text} style={styles.infoCallout} />
  );
};

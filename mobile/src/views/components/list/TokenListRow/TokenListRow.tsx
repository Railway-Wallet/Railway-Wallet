import React, { ReactNode } from "react";
import { Image } from "react-native";
import {
  ERC20Token,
  getTokenDisplayHeader,
  imageForToken,
  useReduxSelector,
} from "@react-shared";
import { ListRow } from "../ListRow/ListRow";
import { styles } from "./styles";

type Props = {
  token: ERC20Token;
  description: string | ReactNode;
  descriptionNumberOfLines?: number;
  defaultNoBorder?: boolean;
  selected?: boolean;
  disabled: boolean;
  rightView?: () => ReactNode;
  onSelect?: () => void;
  error?: boolean;
};

export const TokenListRow: React.FC<Props> = ({
  token,
  description,
  defaultNoBorder,
  descriptionNumberOfLines,
  selected,
  onSelect,
  rightView,
  error,
  disabled,
}) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const leftView = () => {
    const icon = imageForToken(token);
    return <Image source={icon} style={styles.tokenIcon} />;
  };

  return (
    <ListRow
      title={getTokenDisplayHeader(
        token,
        wallets.available,
        network.current.name
      )}
      description={description}
      defaultNoBorder={defaultNoBorder}
      descriptionNumberOfLines={descriptionNumberOfLines}
      selected={selected}
      disabled={disabled}
      leftView={leftView}
      rightView={rightView}
      rightStyle={styles.rightView}
      onSelect={onSelect}
      multilineTitle
      error={error}
    />
  );
};

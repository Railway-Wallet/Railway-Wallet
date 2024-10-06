import React from "react";
import { ButtonWithTextAndIcon } from "@components/buttons/ButtonWithTextAndIcon/ButtonWithTextAndIcon";
import { ButtonWithTextAndIconVerticalIOS } from "@components/buttons/ButtonWithTextAndIconVerticalIOS/ButtonWithTextAndIconVerticalIOS";
import {
  ERC20Token,
  getTokenDisplayNameShort,
  useReduxSelector,
} from "@react-shared";
import { isAndroid } from "@services/util/platform-os-service";

type Props = {
  token?: ERC20Token;
  onTapTokenSelector: () => void;
};

export const SelectTokenInlineButton: React.FC<Props> = ({
  token,
  onTapTokenSelector,
}: Props) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const tokenDisplayName = token
    ? getTokenDisplayNameShort(token, wallets.available, network.current.name)
    : "N/A";

  return isAndroid() ? (
    <ButtonWithTextAndIcon
      title={tokenDisplayName}
      icon="chevron-down"
      onPress={onTapTokenSelector}
    />
  ) : (
    <ButtonWithTextAndIconVerticalIOS
      title={tokenDisplayName}
      icon="chevron-down"
      onPress={onTapTokenSelector}
    />
  );
};

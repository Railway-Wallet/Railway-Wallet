import React from "react";
import { FloatingHeader } from "@components/headers/FloatingHeader/FloatingHeader";
import { easeInCubic, styleguide } from "@react-shared";
import { WalletNetworkSelector } from "../WalletNetworkSelector/WalletNetworkSelector";

type Props = {
  opacity: number;
  onTapNetworkSelector: () => void;
  onTapWallets: () => void;
};

export const calculateFloatingHeaderOpacityFromPageContentOffset = (
  pageContentOffset: number
) => {
  let offset = pageContentOffset - 5;

  offset = Math.max(0, offset);
  offset = Math.min(30, offset);

  let opacity = offset / 30;

  opacity = easeInCubic(opacity);

  return opacity;
};

export const WalletFloatingHeader: React.FC<Props> = ({
  opacity,
  onTapNetworkSelector,
  onTapWallets,
}) => {
  const headerRight = () => {
    return (
      <WalletNetworkSelector onTap={onTapNetworkSelector} isNavBar={true} />
    );
  };

  return (
    <FloatingHeader
      opacity={opacity}
      title="Wallets"
      headerRight={headerRight()}
      backgroundColor={styleguide.colors.headerBackground}
      onPressTitle={onTapWallets}
      isModal={false}
    />
  );
};

import React from "react";
import { Dimensions } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { IconNo, styleguide } from "@react-shared";

const MAX_SIZE = 240;

export const createRailgunQrCode = (value: string) => {
  const totalMargin = 108;
  const windowWidth = Dimensions.get("window").width;
  const size = Math.min(MAX_SIZE, windowWidth - totalMargin);
  const railgunGradient = styleguide.colors.gradients.railgun;

  return (
    <QRCode
      value={value}
      size={size}
      enableLinearGradient={true}
      gradientDirection={["170"]}
      linearGradient={railgunGradient.colors}
    />
  );
};

export const fadedQrCodePlaceholder = (showErrorIcon: boolean = false) => {
  const totalMargin = 108;
  const windowWidth = Dimensions.get("window").width;
  const size = Math.min(MAX_SIZE, windowWidth - totalMargin);

  return (
    <QRCode
      value={"Invalid address"}
      size={size}
      color={styleguide.colors.gray7()}
      logo={showErrorIcon ? IconNo() : undefined}
      logoSize={72}
    />
  );
};

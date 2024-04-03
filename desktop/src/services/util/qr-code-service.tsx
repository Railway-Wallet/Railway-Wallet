import { styleguide } from '@react-shared';
import QRCode from 'qrcode.react';

const DEFAULT_SIZE = 256;

export const createRailgunQrCode = (value: string, size?: number) => {
  return <QRCode value={value} size={size ?? DEFAULT_SIZE} fgColor="#1E3C67" />;
};

export const fadedQrCodePlaceholder = (size?: number) => {
  return (
    <QRCode
      value={'Invalid address'}
      size={size ?? DEFAULT_SIZE}
      fgColor={styleguide.colors.gray7()}
    />
  );
};

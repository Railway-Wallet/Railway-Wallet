import { NetworkName } from '@railgun-community/shared-models';
import { getNetworkFrontendConfig, styleguide } from '@react-shared';

export const getGradientColor = (
  networkName: NetworkName,
  isRailgun: boolean,
  isHorizontal: boolean = false,
) => {
  let colors: string[];
  if (isRailgun) {
    colors = styleguide.colors.gradients.railgun.colors;
  } else {
    colors = getNetworkFrontendConfig(networkName).gradientColors;
  }

  if (isHorizontal) {
    return `linear-gradient(to bottom left, ${colors})`;
  }

  return `linear-gradient(${colors})`;
};

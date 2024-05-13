import { NetworkName } from '@railgun-community/shared-models';
import {
  ImageChainArbitrum,
  ImageChainBinance,
  ImageChainEthereum,
  ImageChainPolygon,
} from '../images/images';
import { styleguide } from '../styles/styleguide';

type NetworkFrontendConfig = {
  backgroundColor: string;
  gradientColors: string[];
  icon?: any;
};

export const getNetworkFrontendConfig = (
  networkName: NetworkName,
): NetworkFrontendConfig => {
  switch (networkName) {
    case NetworkName.Ethereum:
      return {
        backgroundColor: styleguide.colors.tokenBackgrounds.ethereum(),
        gradientColors: styleguide.colors.gradients.ethereum.colors,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        icon: ImageChainEthereum(),
      };
    case NetworkName.BNBChain:
      return {
        backgroundColor: styleguide.colors.tokenBackgrounds.binance(),
        gradientColors: styleguide.colors.gradients.binance.colors,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        icon: ImageChainBinance(),
      };
    case NetworkName.Polygon:
      return {
        backgroundColor: styleguide.colors.tokenBackgrounds.polygon(),
        gradientColors: styleguide.colors.gradients.polygon.colors,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        icon: ImageChainPolygon(),
      };
    case NetworkName.Arbitrum:
      return {
        backgroundColor: styleguide.colors.tokenBackgrounds.arbitrum(),
        gradientColors: styleguide.colors.gradients.arbitrum.colors,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        icon: ImageChainArbitrum(),
      };
    case NetworkName.EthereumRopsten_DEPRECATED:
    case NetworkName.EthereumGoerli_DEPRECATED:
    case NetworkName.EthereumSepolia:
    case NetworkName.PolygonMumbai:
    case NetworkName.ArbitrumGoerli:
    case NetworkName.Hardhat:
      return {
        backgroundColor: styleguide.colors.tokenBackgrounds.testnet(),
        gradientColors: styleguide.colors.gradients.testnet.colors,
      };
  }
};

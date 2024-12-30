import { NetworkName } from '@railgun-community/shared-models';
import {
  ImageChainArbitrum,
  ImageChainBinance,
  ImageChainEthereum,
  ImageChainHardhat,
  ImageChainPolygon,
  ImageChainSepolia,
  ImageTokenArb,
  ImageTokenBnb,
  ImageTokenEth,
  ImageTokenHardhat,
  ImageTokenMatic,
  ImageTokenSepolia,
} from '../images/images';
import { styleguide } from '../styles/styleguide';

type NetworkFrontendConfig = {
  backgroundColor: string;
  gradientColors: string[];
  icon?: any;
  symbolIcon?: any;
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
        symbolIcon: ImageTokenEth(),
      };
    case NetworkName.BNBChain:
      return {
        backgroundColor: styleguide.colors.tokenBackgrounds.binance(),
        gradientColors: styleguide.colors.gradients.binance.colors,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        icon: ImageChainBinance(),
        symbolIcon: ImageTokenBnb(),
      };
    case NetworkName.Polygon:
      return {
        backgroundColor: styleguide.colors.tokenBackgrounds.polygon(),
        gradientColors: styleguide.colors.gradients.polygon.colors,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        icon: ImageChainPolygon(),
        symbolIcon: ImageTokenMatic(),
      };
    case NetworkName.Arbitrum:
      return {
        backgroundColor: styleguide.colors.tokenBackgrounds.arbitrum(),
        gradientColors: styleguide.colors.gradients.arbitrum.colors,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        icon: ImageChainArbitrum(),
        symbolIcon: ImageTokenArb(),
      };
    case NetworkName.EthereumSepolia:
      return {
        backgroundColor: styleguide.colors.tokenBackgrounds.ethereum(),
        gradientColors: styleguide.colors.gradients.ethereum.colors,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        icon: ImageChainSepolia(),
        symbolIcon: ImageTokenSepolia(),
      };
    case NetworkName.PolygonAmoy:
    case NetworkName.EthereumRopsten_DEPRECATED:
    case NetworkName.EthereumGoerli_DEPRECATED:
    case NetworkName.PolygonMumbai_DEPRECATED:
    case NetworkName.ArbitrumGoerli_DEPRECATED:
    case NetworkName.Hardhat:
      return {
        backgroundColor: styleguide.colors.tokenBackgrounds.testnet(),
        gradientColors: styleguide.colors.gradients.testnet.colors,
        icon: ImageChainHardhat(),
        symbolIcon: ImageTokenHardhat(),
      };
  }
};

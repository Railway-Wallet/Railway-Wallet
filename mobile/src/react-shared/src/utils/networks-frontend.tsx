import { NetworkName } from "@railgun-community/shared-models";
import {
  ImageChainArbitrum,
  ImageChainBinance,
  ImageChainEthereum,
  ImageChainPolygon,
} from "../images/images";
import { styleguide } from "../styles/styleguide";

type NetworkFrontendConfig = {
  backgroundColor: string;
  gradientColors: string[];
  icon?: any;
};

export const getNetworkFrontendConfig = (
  networkName: NetworkName
): NetworkFrontendConfig => {
  switch (networkName) {
    case NetworkName.Ethereum:
      return {
        backgroundColor: styleguide.colors.tokenBackgrounds.ethereum(),
        gradientColors: styleguide.colors.gradients.ethereum.colors,

        icon: ImageChainEthereum(),
      };
    case NetworkName.BNBChain:
      return {
        backgroundColor: styleguide.colors.tokenBackgrounds.binance(),
        gradientColors: styleguide.colors.gradients.binance.colors,

        icon: ImageChainBinance(),
      };
    case NetworkName.Polygon:
      return {
        backgroundColor: styleguide.colors.tokenBackgrounds.polygon(),
        gradientColors: styleguide.colors.gradients.polygon.colors,

        icon: ImageChainPolygon(),
      };
    case NetworkName.Arbitrum:
      return {
        backgroundColor: styleguide.colors.tokenBackgrounds.arbitrum(),
        gradientColors: styleguide.colors.gradients.arbitrum.colors,

        icon: ImageChainArbitrum(),
      };
    case NetworkName.EthereumSepolia:
    case NetworkName.PolygonAmoy:
    case NetworkName.EthereumRopsten_DEPRECATED:
    case NetworkName.EthereumGoerli_DEPRECATED:
    case NetworkName.PolygonMumbai_DEPRECATED:
    case NetworkName.ArbitrumGoerli_DEPRECATED:
    case NetworkName.Hardhat:
      return {
        backgroundColor: styleguide.colors.tokenBackgrounds.testnet(),
        gradientColors: styleguide.colors.gradients.testnet.colors,
      };
  }
};

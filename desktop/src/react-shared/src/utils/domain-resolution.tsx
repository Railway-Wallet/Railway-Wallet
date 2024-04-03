import { NetworkName } from '@railgun-community/shared-models';
import { UnstoppableDataRecordPath } from '../models/address-resolution';

export const getUnstoppableRecordPathForNetwork = (
  networkName: NetworkName,
  isRailgun: boolean,
): UnstoppableDataRecordPath => {
  if (isRailgun) {
    return UnstoppableDataRecordPath.Railgun;
  }

  switch (networkName) {
    case NetworkName.Ethereum:
      return UnstoppableDataRecordPath.Ethereum;
    case NetworkName.BNBChain:
      return UnstoppableDataRecordPath.BNBSmartChain;
    case NetworkName.Polygon:
      return UnstoppableDataRecordPath.Polygon;
    case NetworkName.Arbitrum:
    case NetworkName.EthereumRopsten_DEPRECATED:
    case NetworkName.EthereumGoerli:
    case NetworkName.EthereumSepolia:
    case NetworkName.PolygonMumbai:
    case NetworkName.ArbitrumGoerli:
    case NetworkName.Hardhat:
      throw new Error('Unstoppable Domains unavailable for this network');
  }
};

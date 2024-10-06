import { NetworkName } from "@railgun-community/shared-models";
import { networkSupportsAlchemy } from "../api/alchemy/alchemy-nft";

export const networkSupportsNFTs = (networkName: NetworkName) => {
  return networkSupportsAlchemy(networkName);
};

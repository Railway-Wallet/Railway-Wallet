import {
  isDefined,
  NetworkName,
  NFTAmount,
  NFTTokenType,
} from "@railgun-community/shared-models";
import axios from "axios";
import { ReactConfig } from "../../../config";
import {
  NFTAmountAndMetadata,
  NFTMetadata,
  NFTVerificationStatus,
} from "../../../models/nft";
import { store } from "../../../redux-store/store";
import { logDevError } from "../../../utils/logging";
import { formatTokenSubID } from "../../../utils/nft";

enum OpenseaSafelistRequestStatus {
  Verified = "verified",
  Approved = "approved",
  Requested = "requested",
  NotRequested = "not_requested",
}

type AlchemyNFTTokenType = "ERC721" | "ERC1155";

type AlchemyNFTMetadata = {
  contract: { address: string };
  id: { tokenId: string; tokenMetadata: { tokenType: AlchemyNFTTokenType } };
  balance: string;
  metadata: {
    image?: string;
    thumbnail?: string;
    external_url?: string;
    name?: string;
    description?: string;
    background_color?: string;
  };
  contractMetadata: {
    name?: string;
    symbol?: string;
    totalSupply?: string;
    deployedBlockNumber?: number;
    openSea?: {
      safelistRequestStatus?: OpenseaSafelistRequestStatus;
      externalUrl?: string;
      lastIngestedAt?: string;
    };
  };
  spamInfo: {
    isSpam?: boolean;
  };
};

type AlchemyNFTBalancesResponse = {
  ownedNfts: AlchemyNFTMetadata[];
};

type AlchemyNFT = {
  contractAddress: string;
  tokenId: string;
  tokenType: AlchemyNFTTokenType;
};

export const alchemyProxyURL = (networkName: NetworkName) => {
  const remoteConfig = store.getState().remoteConfig.current;
  if (!isDefined(remoteConfig)) {
    throw new Error("Config not available.");
  }
  const subdomain = alchemySubdomain(networkName);
  return `${remoteConfig.proxyApiUrl}/alchemy/${subdomain}`;
};

const alchemySubdomain = (networkName: NetworkName) => {
  switch (networkName) {
    case NetworkName.Ethereum:
      return "eth-mainnet";
    case NetworkName.Polygon:
      return "polygon-mainnet";
    case NetworkName.Arbitrum:
      return "arb-mainnet";
    case NetworkName.EthereumSepolia:
      return "eth-sepolia";
    case NetworkName.BNBChain:
    case NetworkName.PolygonAmoy:
    case NetworkName.ArbitrumGoerli_DEPRECATED:
    case NetworkName.PolygonMumbai_DEPRECATED:
    case NetworkName.EthereumRopsten_DEPRECATED:
    case NetworkName.EthereumGoerli_DEPRECATED:
    case NetworkName.Hardhat:
      throw new Error("Unhandled Alchemy network");
  }
};

const alchemyNetworkSupportsFilters = (networkName: NetworkName) => {
  switch (networkName) {
    case NetworkName.Ethereum:
    case NetworkName.Polygon:
      return true;
    case NetworkName.Arbitrum:
    case NetworkName.EthereumSepolia:
    case NetworkName.BNBChain:
    case NetworkName.PolygonAmoy:
    case NetworkName.PolygonMumbai_DEPRECATED:
    case NetworkName.ArbitrumGoerli_DEPRECATED:
    case NetworkName.EthereumGoerli_DEPRECATED:
    case NetworkName.EthereumRopsten_DEPRECATED:
    case NetworkName.Hardhat:
      return false;
  }
};

export const networkSupportsAlchemy = (networkName: NetworkName) => {
  try {
    alchemySubdomain(networkName);
    return true;
  } catch {
    return false;
  }
};

export const pullOwnedNFTMetadata = async (
  networkName: NetworkName,
  ethAddress: string
): Promise<Optional<NFTAmountAndMetadata[]>> => {
  try {
    if (!ReactConfig.ENABLE_NFTS) {
      throw new Error("NFT support disabled");
    }

    const url = new URL(`${alchemyProxyURL(networkName)}/getNFTs`);

    url.searchParams.append("owner", ethAddress);

    if (alchemyNetworkSupportsFilters(networkName)) {
      url.searchParams.append("excludeFilters[]", "SPAM");
    }

    const rsp = await axios.get(url.toString());
    const data: AlchemyNFTBalancesResponse = rsp.data;

    const filteredNFTs = filterAlchemyNFTs(data.ownedNfts);

    const nftAmountsAndMetadata: NFTAmountAndMetadata[] = filteredNFTs.map(
      (alchemyNFTMetadata) =>
        createNFTAmountAndMetadataFromAlchemyNFT(
          networkName,
          alchemyNFTMetadata
        )
    );
    return nftAmountsAndMetadata;
  } catch (cause) {
    if (!(cause instanceof Error)) {
      throw cause;
    }
    throw new Error(`Could not get data for NFTs`, { cause });
  }
};

export const getNFTsAndMetadata = async (
  networkName: NetworkName,
  nftAmounts: NFTAmount[],
  refreshCache: boolean
): Promise<Optional<NFTAmountAndMetadata[]>> => {
  try {
    if (!ReactConfig.ENABLE_NFTS) {
      throw new Error("NFT support disabled");
    }

    const alchemyNFTs: AlchemyNFT[] = nftAmounts.map((nftAmount) => ({
      contractAddress: nftAmount.nftAddress,
      tokenId: nftAmount.tokenSubID,
      tokenType: alchemyTokenTypeFromNFTTokenType(nftAmount.nftTokenType),
    }));
    const url = `${alchemyProxyURL(networkName)}/getNFTMetadataBatch`;

    const rsp = await axios.post(url, {
      tokens: alchemyNFTs,
      refreshCache,
    });

    const data: AlchemyNFTMetadata[] = rsp.data;
    const filteredNFTs = filterAlchemyNFTs(data);

    const nftsAndMetadata: NFTAmountAndMetadata[] = filteredNFTs.map(
      (alchemyNFTMetadata) =>
        createNFTAmountAndMetadataFromAlchemyNFT(
          networkName,
          alchemyNFTMetadata
        )
    );

    return nftsAndMetadata;
  } catch (cause) {
    if (!(cause instanceof Error)) {
      throw cause;
    }
    logDevError(new Error(`Could not get data for NFTs`, { cause }));
    return undefined;
  }
};

const filterAlchemyNFTs = (
  unfiltered: AlchemyNFTMetadata[]
): AlchemyNFTMetadata[] => {
  return unfiltered
    .filter((nftMetadata) => {
      return ["ERC721", "ERC1155"].includes(
        nftMetadata.id.tokenMetadata.tokenType
      );
    })
    .filter((nftMetadata) => {
      return nftMetadata.spamInfo?.isSpam !== false;
    });
};

const createNFTAmountAndMetadataFromAlchemyNFT = (
  networkName: NetworkName,
  nftMetadata: AlchemyNFTMetadata
) => {
  const nftAmount: NFTAmount = {
    nftAddress: nftMetadata.contract.address.toLowerCase(),
    nftTokenType: nftTokenTypeFromAlchemyTokenType(
      nftMetadata.id.tokenMetadata.tokenType
    ),
    tokenSubID: formatTokenSubID(nftMetadata.id.tokenId),
    amountString: nftMetadata.balance ?? "1",
  };
  const metadata: NFTMetadata = {
    image: nftMetadata.metadata.image,
    thumbnail: nftMetadata.metadata.thumbnail,
    externalURL: nftMetadata.metadata.external_url,
    name: nftMetadata.metadata.name,
    collectionName: nftMetadata.contractMetadata?.name,
    collectionExternalURL: nftMetadata.contractMetadata?.openSea?.externalUrl,
    description: nftMetadata.metadata.description,
    backgroundColor: nftMetadata.metadata.background_color,
    verificationStatus: getNFTVerificationStatus(
      networkName,
      nftAmount,
      nftMetadata
    ),
  };
  return {
    nftAmount,
    metadata,
  };
};

const getNFTVerificationStatus = (
  networkName: NetworkName,
  nftAmount: NFTAmount,
  nftMetadata: AlchemyNFTMetadata
): NFTVerificationStatus => {
  const manuallyApproved: string[] =
    manuallyApprovedLowercaseNFTCollectionAddresses(networkName);
  if (manuallyApproved.includes(nftAmount.nftAddress)) {
    return NFTVerificationStatus.Verified;
  }
  if (nftMetadata.spamInfo?.isSpam ?? false) {
    return NFTVerificationStatus.Spam;
  }

  const safelistRequestStatus =
    nftMetadata.contractMetadata.openSea?.safelistRequestStatus;
  if (safelistRequestStatus === OpenseaSafelistRequestStatus.Verified) {
    return NFTVerificationStatus.Verified;
  }
  if (safelistRequestStatus === OpenseaSafelistRequestStatus.Approved) {
    return NFTVerificationStatus.Approved;
  }
  return NFTVerificationStatus.Unknown;
};

const manuallyApprovedLowercaseNFTCollectionAddresses = (
  networkName: NetworkName
): string[] => {
  switch (networkName) {
    case NetworkName.Ethereum:
      return [];
    case NetworkName.BNBChain:
    case NetworkName.Polygon:
    case NetworkName.Arbitrum:
    case NetworkName.Hardhat:
    case NetworkName.EthereumSepolia:
    case NetworkName.PolygonAmoy:
    case NetworkName.PolygonMumbai_DEPRECATED:
    case NetworkName.ArbitrumGoerli_DEPRECATED:
    case NetworkName.EthereumGoerli_DEPRECATED:
    case NetworkName.EthereumRopsten_DEPRECATED:
      return [];
  }
};

export const nftTokenTypeFromAlchemyTokenType = (
  tokenType: AlchemyNFTTokenType
): NFTTokenType => {
  switch (tokenType) {
    case "ERC721":
      return NFTTokenType.ERC721;
    case "ERC1155":
      return NFTTokenType.ERC1155;
  }
};

const alchemyTokenTypeFromNFTTokenType = (
  tokenType: NFTTokenType
): AlchemyNFTTokenType => {
  switch (tokenType) {
    case NFTTokenType.ERC721:
      return "ERC721";
    case NFTTokenType.ERC1155:
      return "ERC1155";
  }
};

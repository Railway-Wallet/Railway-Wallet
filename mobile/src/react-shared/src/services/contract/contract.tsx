import { Contract, Provider, Signer } from "ethers";
import { abi } from "../abi/abi";
import { Erc20, Erc721, Erc1155, TestERC20 } from "./typechain";

export const erc20Contract = (
  tokenAddress: string,
  signerOrProvider: Signer | Provider
) => {
  if (!tokenAddress || !tokenAddress.length) {
    throw new Error("Token address is required for ERC20 Contract");
  }

  return new Contract(
    tokenAddress,
    abi.erc20,
    signerOrProvider
  ) as unknown as Erc20;
};

export const erc721Contract = (
  nftAddress: string,
  signerOrProvider: Signer | Provider
) => {
  if (!nftAddress || !nftAddress.length) {
    throw new Error("NFT address is required for ERC721 Contract");
  }

  return new Contract(
    nftAddress,
    abi.erc721,
    signerOrProvider
  ) as unknown as Erc721;
};

export const erc1155Contract = (
  nftAddress: string,
  signerOrProvider: Signer | Provider
) => {
  if (!nftAddress || !nftAddress.length) {
    throw new Error("NFT address is required for ERC1155 Contract");
  }

  return new Contract(
    nftAddress,
    abi.erc721,
    signerOrProvider
  ) as unknown as Erc1155;
};

export const mintableTestERC20Contract = (
  tokenAddress: string,
  signerOrProvider: Signer | Provider
) => {
  if (!tokenAddress || !tokenAddress.length) {
    throw new Error("Token address is required for ERC20 Contract");
  }

  return new Contract(
    tokenAddress,
    abi.mintableTestERC20,
    signerOrProvider
  ) as unknown as TestERC20;
};

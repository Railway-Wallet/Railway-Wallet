import { NFTAmount } from "@railgun-community/shared-models";

export enum NFTVerificationStatus {
  Verified = "Verified",
  Approved = "Approved",
  Unknown = "Unknown",
  Spam = "Spam",
}

export type NFTMetadata = {
  image: Optional<string>;
  thumbnail: Optional<string>;
  externalURL: Optional<string>;
  name: Optional<string>;
  collectionName: Optional<string>;
  collectionExternalURL: Optional<string>;
  description: Optional<string>;
  backgroundColor: Optional<string>;
  verificationStatus: NFTVerificationStatus;
};

export type NFTAmountAndMetadata = {
  nftAmount: NFTAmount;
  metadata: NFTMetadata;
};

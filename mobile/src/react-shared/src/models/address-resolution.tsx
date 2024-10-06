export enum AddressResolverStatus {
  Resolving = "Resolving",
  Resolved = "Resolved",
  Error = "Error",
}

export enum UnstoppableDataRecordPath {
  Railgun = "crypto.0ZK.version.0ZK.address",
  Ethereum = "crypto.ETH.address",
  BNBSmartChain = "crypto.BSC.address",
  Polygon = "crypto.MATIC.version.MATIC.address",
}

export enum ResolvedAddressType {
  ENS = "ENS",
  UnstoppableDomains = "UnstoppableDomains",
  RawText = "RawText",
}

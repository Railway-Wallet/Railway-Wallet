import { isDefined, NetworkName } from "@railgun-community/shared-models";

export const SCAN_SITE_NOT_FOUND_TEXT = "[Scan site not found]";

enum SCAN_BASE_URL {
  Etherscan = "https://etherscan.io",
  Bscscan = "https://bscscan.com",
  Polygonscan = "https://polygonscan.com",
  Arbiscan = "https://arbiscan.io",
  Ropstenscan = "https://ropsten.etherscan.io",
  Goerliscan = "https://goerli.etherscan.io",
  Sepoliascan = "https://sepolia.etherscan.io",
  Mumbaiscan = "https://mumbai.polygonscan.com",
  ArbiscanGoerli = "https://goerli.arbiscan.io",
  PolygonscanAmoy = "https://amoy.polygonscan.com",
}

export const baseUrlExternalScanSite = (
  networkName: NetworkName
): Optional<string> => {
  switch (networkName) {
    case NetworkName.Ethereum:
      return SCAN_BASE_URL.Etherscan;
    case NetworkName.BNBChain:
      return SCAN_BASE_URL.Bscscan;
    case NetworkName.Polygon:
      return SCAN_BASE_URL.Polygonscan;
    case NetworkName.Arbitrum:
      return SCAN_BASE_URL.Arbiscan;
    case NetworkName.EthereumSepolia:
      return SCAN_BASE_URL.Sepoliascan;
    case NetworkName.PolygonAmoy:
      return SCAN_BASE_URL.PolygonscanAmoy;
    case NetworkName.EthereumRopsten_DEPRECATED:
      return SCAN_BASE_URL.Ropstenscan;
    case NetworkName.EthereumGoerli_DEPRECATED:
      return SCAN_BASE_URL.Goerliscan;
    case NetworkName.PolygonMumbai_DEPRECATED:
      return SCAN_BASE_URL.Mumbaiscan;
    case NetworkName.ArbitrumGoerli_DEPRECATED:
      return SCAN_BASE_URL.ArbiscanGoerli;
    case NetworkName.Hardhat:
      return;
  }
};

export const transactionLinkOnExternalScanSite = (
  networkName: NetworkName,
  txHash: string
): Optional<string> => {
  const baseUrl = baseUrlExternalScanSite(networkName);
  if (!isDefined(baseUrl) || !baseUrl) return;
  return `${baseUrl}/tx/${txHash}`;
};

export const addressLinkOnExternalScanSite = (
  networkName: NetworkName,
  address: string
): Optional<string> => {
  const baseUrl = baseUrlExternalScanSite(networkName);
  if (!isDefined(baseUrl) || !baseUrl) return "Unknown link";
  return `${baseUrl}/address/${address}`;
};

export const getExternalScanSiteName = (networkName: NetworkName): string => {
  switch (networkName) {
    case NetworkName.Ethereum:
      return "Etherscan";
    case NetworkName.BNBChain:
      return "BscScan";
    case NetworkName.Polygon:
      return "Polygonscan";
    case NetworkName.Arbitrum:
      return "Arbiscan";
    case NetworkName.EthereumSepolia:
      return "Etherscan (Sepolia)";
    case NetworkName.PolygonAmoy:
      return "Polygonscan (Amoy)";
    case NetworkName.EthereumRopsten_DEPRECATED:
      return "Etherscan (Ropsten)";
    case NetworkName.EthereumGoerli_DEPRECATED:
      return "Etherscan (Görli)";
    case NetworkName.PolygonMumbai_DEPRECATED:
      return "Polygonscan (Mumbai)";
    case NetworkName.ArbitrumGoerli_DEPRECATED:
      return "Arbiscan (Görli)";
    case NetworkName.Hardhat:
      return SCAN_SITE_NOT_FOUND_TEXT;
  }
};

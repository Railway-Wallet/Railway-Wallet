import { isDefined, NetworkName } from '@railgun-community/shared-models';

export const SCAN_SITE_NOT_FOUND_TEXT = '[Scan site not found]';

enum SCAN_BASE_URL {
  Etherscan = 'https://etherscan.io',
  Bscscan = 'https://bscscan.com',
  Polygonscan = 'https://polygonscan.com',
  Arbiscan = 'https://arbiscan.io',
  Ropstenscan = 'https://ropsten.etherscan.io',
  Goerliscan = 'https://goerli.etherscan.io',
  Sepoliascan = 'https://sepolia.etherscan.io',
  Mumbaiscan = 'https://mumbai.polygonscan.com',
  ArbiscanGoerli = 'https://goerli.arbiscan.io',
}

export const baseUrlExternalScanSite = (
  networkName: NetworkName,
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
    case NetworkName.EthereumRopsten_DEPRECATED:
      return SCAN_BASE_URL.Ropstenscan;
    case NetworkName.EthereumGoerli:
      return SCAN_BASE_URL.Goerliscan;
    case NetworkName.EthereumSepolia:
      return SCAN_BASE_URL.Sepoliascan;
    case NetworkName.PolygonMumbai:
      return SCAN_BASE_URL.Mumbaiscan;
    case NetworkName.ArbitrumGoerli:
      return SCAN_BASE_URL.ArbiscanGoerli;
    case NetworkName.Hardhat:
      return;
  }
};

export const transactionLinkOnExternalScanSite = (
  networkName: NetworkName,
  txHash: string,
): Optional<string> => {
  const baseUrl = baseUrlExternalScanSite(networkName);
  if (!isDefined(baseUrl) || !baseUrl) return;
  return `${baseUrl}/tx/${txHash}`;
};

export const addressLinkOnExternalScanSite = (
  networkName: NetworkName,
  address: string,
): Optional<string> => {
  const baseUrl = baseUrlExternalScanSite(networkName);
  if (!isDefined(baseUrl) || !baseUrl) return 'Unknown link';
  return `${baseUrl}/address/${address}`;
};

export const getExternalScanSiteName = (networkName: NetworkName): string => {
  switch (networkName) {
    case NetworkName.Ethereum:
      return 'Etherscan';
    case NetworkName.BNBChain:
      return 'BscScan';
    case NetworkName.Polygon:
      return 'Polygonscan';
    case NetworkName.Arbitrum:
      return 'Arbiscan';
    case NetworkName.EthereumRopsten_DEPRECATED:
      return 'Etherscan (Ropsten)';
    case NetworkName.EthereumGoerli:
      return 'Etherscan (Görli)';
    case NetworkName.EthereumSepolia:
      return 'Etherscan (Sepolia)';
    case NetworkName.PolygonMumbai:
      return 'Polygonscan (Mumbai)';
    case NetworkName.ArbitrumGoerli:
      return 'Arbiscan (Görli)';
    case NetworkName.Hardhat:
      return SCAN_SITE_NOT_FOUND_TEXT;
  }
};

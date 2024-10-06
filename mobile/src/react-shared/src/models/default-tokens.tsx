import { NETWORK_CONFIG, NetworkName } from "@railgun-community/shared-models";
import {
  ERC20TokenFullInfo,
  MINTABLE_TEST_TOKEN_ROPSTEN,
  TokenIconKey,
} from "./token";

export const DEFAULT_WALLET_TOKENS_FOR_NETWORK: {
  [name in NetworkName]: ERC20TokenFullInfo[];
} = {
  [NetworkName.Ethereum]: [
    {
      name: "Ether",
      symbol: "ETH",
      address: NETWORK_CONFIG[NetworkName.Ethereum].baseToken.wrappedAddress,
      icon: TokenIconKey.ImageTokenEthKey,
      decimals: 18,
      isBaseToken: true,
      disableWalletRemoval: true,
    },
    {
      name: "Wrapped Ether",
      symbol: "WETH",
      address: NETWORK_CONFIG[NetworkName.Ethereum].baseToken.wrappedAddress,
      icon: TokenIconKey.ImageTokenWethKey,
      decimals: 18,
      disableWalletRemoval: true,
    },
    {
      name: "Wrapped Bitcoin",
      symbol: "WBTC",
      address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
      icon: TokenIconKey.ImageTokenWbtcKey,
      decimals: 8,
    },
    {
      name: "Tether",
      symbol: "USDT",
      icon: TokenIconKey.ImageTokenUsdtKey,
      address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
      decimals: 6,
    },
    {
      name: "Dai",
      symbol: "DAI",
      address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      icon: TokenIconKey.ImageTokenDaiKey,
      decimals: 18,
    },
    {
      name: "USDC",
      symbol: "USDC",
      address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      icon: TokenIconKey.ImageTokenUsdcKey,
      decimals: 6,
    },
    {
      name: "RAIL",
      symbol: "RAIL",
      address: "0xe76c6c83af64e4c60245d8c7de953df673a7a33d",
      icon: TokenIconKey.ImageTokenRailKey,
      decimals: 18,
    },
  ],
  [NetworkName.BNBChain]: [
    {
      name: "Binance Coin",
      symbol: "BNB",
      address: NETWORK_CONFIG[NetworkName.BNBChain].baseToken.wrappedAddress,
      icon: TokenIconKey.ImageTokenBnbKey,
      decimals: 18,
      isBaseToken: true,
      disableWalletRemoval: true,
    },
    {
      name: "Wrapped BNB",
      symbol: "WBNB",
      address: NETWORK_CONFIG[NetworkName.BNBChain].baseToken.wrappedAddress,
      icon: TokenIconKey.ImageTokenWbnbKey,
      decimals: 18,
      disableWalletRemoval: true,
    },
    {
      name: "Tether",
      symbol: "USDT",
      icon: TokenIconKey.ImageTokenUsdtKey,
      address: "0x55d398326f99059ff775485246999027b3197955",
      decimals: 18,
    },
    {
      name: "Binance USD",
      symbol: "BUSD",
      address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
      icon: TokenIconKey.ImageTokenBusdKey,
      decimals: 18,
    },
    {
      name: "Dai",
      symbol: "DAI",
      address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
      icon: TokenIconKey.ImageTokenDaiKey,
      decimals: 18,
    },
  ],
  [NetworkName.Polygon]: [
    {
      name: "Polygon",
      symbol: "MATIC",
      address: NETWORK_CONFIG[NetworkName.Polygon].baseToken.wrappedAddress,
      icon: TokenIconKey.ImageTokenMaticKey,
      decimals: 18,
      isBaseToken: true,
      disableWalletRemoval: true,
    },
    {
      name: "Wrapped Matic",
      symbol: "WMATIC",
      address: NETWORK_CONFIG[NetworkName.Polygon].baseToken.wrappedAddress,
      icon: TokenIconKey.ImageTokenWmaticKey,
      decimals: 18,
      disableWalletRemoval: true,
    },
    {
      name: "Tether",
      symbol: "USDT",
      icon: TokenIconKey.ImageTokenUsdtKey,
      address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
      decimals: 6,
    },
    {
      name: "Dai",
      symbol: "DAI",
      address: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
      icon: TokenIconKey.ImageTokenDaiKey,
      decimals: 18,
    },
    {
      name: "USDC (Native)",
      symbol: "USDC",
      icon: TokenIconKey.ImageTokenUsdcKey,
      decimals: 6,
      address: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
    },
    {
      name: "USDC.e",
      symbol: "USDC.e",
      address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
      icon: TokenIconKey.ImageTokenUSDCeKey,
      decimals: 6,
    },
  ],
  [NetworkName.Arbitrum]: [
    {
      name: "Ether",
      symbol: "ETH",
      address: NETWORK_CONFIG[NetworkName.Arbitrum].baseToken.wrappedAddress,
      icon: TokenIconKey.ImageTokenEthKey,
      decimals: 18,
      isBaseToken: true,
      disableWalletRemoval: true,
    },
    {
      name: "Wrapped Ether",
      symbol: "WETH",
      address: NETWORK_CONFIG[NetworkName.Arbitrum].baseToken.wrappedAddress,
      icon: TokenIconKey.ImageTokenWethKey,
      decimals: 18,
      disableWalletRemoval: true,
    },
    {
      name: "Tether USD",
      symbol: "USDT",
      icon: TokenIconKey.ImageTokenUsdtKey,
      decimals: 6,
      address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    },
    {
      name: "Dai",
      symbol: "DAI",
      icon: TokenIconKey.ImageTokenDaiKey,
      decimals: 18,
      address: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
    },
    {
      name: "USDC (Native)",
      symbol: "USDC",
      icon: TokenIconKey.ImageTokenUsdcKey,
      decimals: 6,
      address: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    },
    {
      name: "USDC.e",
      symbol: "USDC.e",
      address: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
      icon: TokenIconKey.ImageTokenUSDCeKey,
      decimals: 6,
    },
  ],
  [NetworkName.PolygonAmoy]: [
    {
      name: "Polygon",
      symbol: "MATIC",
      address: NETWORK_CONFIG[NetworkName.PolygonAmoy].baseToken.wrappedAddress,
      icon: TokenIconKey.ImageTokenMaticKey,
      decimals: 18,
      isBaseToken: true,
      disableWalletRemoval: true,
    },
  ],
  [NetworkName.EthereumRopsten_DEPRECATED]: [
    {
      name: "Ether",
      symbol: "ETH",
      address:
        NETWORK_CONFIG[NetworkName.EthereumRopsten_DEPRECATED].baseToken
          .wrappedAddress,
      icon: TokenIconKey.ImageTokenEthKey,
      decimals: 18,
      isBaseToken: true,
      disableWalletRemoval: true,
    },
    {
      name: "Wrapped Ether",
      symbol: "WETH",
      address:
        NETWORK_CONFIG[NetworkName.EthereumRopsten_DEPRECATED].baseToken
          .wrappedAddress,
      icon: TokenIconKey.ImageTokenWethKey,
      decimals: 18,
      disableWalletRemoval: true,
    },
    {
      name: "Dai",
      symbol: "DAI",
      address: "0xaD6D458402F60fD3Bd25163575031ACDce07538D",
      icon: TokenIconKey.ImageTokenDaiKey,
      decimals: 18,
    },
    {
      name: "USDC",
      symbol: "USDC",
      address: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
      icon: TokenIconKey.ImageTokenUsdcKey,
      decimals: 6,
    },
    MINTABLE_TEST_TOKEN_ROPSTEN,
  ],
  [NetworkName.EthereumGoerli_DEPRECATED]: [
    {
      name: "Ether",
      symbol: "ETH",
      address:
        NETWORK_CONFIG[NetworkName.EthereumGoerli_DEPRECATED].baseToken
          .wrappedAddress,
      icon: TokenIconKey.ImageTokenEthKey,
      decimals: 18,
      isBaseToken: true,
      disableWalletRemoval: true,
    },
    {
      name: "Wrapped Ether",
      symbol: "WETH",
      address:
        NETWORK_CONFIG[NetworkName.EthereumGoerli_DEPRECATED].baseToken
          .wrappedAddress,
      icon: TokenIconKey.ImageTokenWethKey,
      decimals: 18,
      disableWalletRemoval: true,
    },
    {
      name: "Dai",
      symbol: "DAI",
      address: "0xdc31ee1784292379fbb2964b3b9c4124d8f89c60",
      icon: TokenIconKey.ImageTokenDaiKey,
      decimals: 18,
    },
    {
      name: "USDC",
      symbol: "USDC",
      address: "0x07865c6e87b9f70255377e024ace6630c1eaa37f",
      icon: TokenIconKey.ImageTokenUsdcKey,
      decimals: 6,
    },
  ],
  [NetworkName.EthereumSepolia]: [
    {
      name: "Ether",
      symbol: "ETH",
      address:
        NETWORK_CONFIG[NetworkName.EthereumSepolia].baseToken.wrappedAddress,
      icon: TokenIconKey.ImageTokenEthKey,
      decimals: 18,
      isBaseToken: true,
      disableWalletRemoval: true,
    },
    {
      name: "Wrapped Ether",
      symbol: "WETH",
      address:
        NETWORK_CONFIG[NetworkName.EthereumSepolia].baseToken.wrappedAddress,
      icon: TokenIconKey.ImageTokenWethKey,
      decimals: 18,
      disableWalletRemoval: true,
    },
    {
      name: "Dai",
      symbol: "DAI",
      address: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6",
      icon: TokenIconKey.ImageTokenDaiKey,
      decimals: 18,
    },
    {
      name: "Tether",
      symbol: "USDT",
      address: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
      icon: TokenIconKey.ImageTokenUsdtKey,
      decimals: 6,
    },
    {
      name: "USDC",
      symbol: "USDC",
      address: "0x8267cF9254734C6Eb452a7bb9AAF97B392258b21",
      icon: TokenIconKey.ImageTokenUsdcKey,
      decimals: 18,
    },
  ],
  [NetworkName.PolygonMumbai_DEPRECATED]: [
    {
      name: "Polygon",
      symbol: "MATIC",
      address:
        NETWORK_CONFIG[NetworkName.PolygonMumbai_DEPRECATED].baseToken
          .wrappedAddress,
      icon: TokenIconKey.ImageTokenMaticKey,
      decimals: 18,
      isBaseToken: true,
      disableWalletRemoval: true,
    },
    {
      name: "Wrapped Matic",
      symbol: "WMATIC",
      address:
        NETWORK_CONFIG[NetworkName.PolygonMumbai_DEPRECATED].baseToken
          .wrappedAddress,
      icon: TokenIconKey.ImageTokenWmaticKey,
      decimals: 18,
      disableWalletRemoval: true,
    },
    {
      name: "Wrapped Ether",
      symbol: "WETH",
      address: "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa",
      icon: TokenIconKey.ImageTokenWethKey,
      decimals: 18,
    },
    {
      name: "USDC",
      symbol: "USDC",
      address: "0xE097d6B3100777DC31B34dC2c58fB524C2e76921",
      icon: TokenIconKey.ImageTokenUsdcKey,
      decimals: 6,
    },
    {
      name: "Dummy ERC20",
      symbol: "DERC20",
      address: "0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1",
      decimals: 18,
    },
  ],
  [NetworkName.ArbitrumGoerli_DEPRECATED]: [
    {
      name: "Ether",
      symbol: "ETH",
      address:
        NETWORK_CONFIG[NetworkName.ArbitrumGoerli_DEPRECATED].baseToken
          .wrappedAddress,
      icon: TokenIconKey.ImageTokenEthKey,
      decimals: 18,
      isBaseToken: true,
      disableWalletRemoval: true,
    },
    {
      name: "Wrapped Ether",
      symbol: "WETH",
      address:
        NETWORK_CONFIG[NetworkName.ArbitrumGoerli_DEPRECATED].baseToken
          .wrappedAddress,
      icon: TokenIconKey.ImageTokenWethKey,
      decimals: 18,
      disableWalletRemoval: true,
    },
  ],
  [NetworkName.Hardhat]: [
    {
      name: "Ether",
      symbol: "ETH",
      address: NETWORK_CONFIG[NetworkName.Hardhat].baseToken.wrappedAddress,
      icon: TokenIconKey.ImageTokenEthKey,
      decimals: 18,
      isBaseToken: true,
      disableWalletRemoval: true,
    },
    {
      name: "Wrapped Ether",
      symbol: "WETH",
      address: NETWORK_CONFIG[NetworkName.Hardhat].baseToken.wrappedAddress,
      icon: TokenIconKey.ImageTokenWethKey,
      decimals: 18,
      disableWalletRemoval: true,
    },
    {
      name: "RAIL",
      symbol: "RAIL",
      address: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
      icon: TokenIconKey.ImageTokenRailKey,
      decimals: 18,
    },
  ],
};

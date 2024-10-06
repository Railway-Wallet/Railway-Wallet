import { NETWORK_CONFIG, NetworkName } from "@railgun-community/shared-models";
import { SearchableERC20, TokenIconKey } from "./token";

export const DEFAULT_SEARCH_TOKENS_FOR_NETWORK: {
  [name in NetworkName]: SearchableERC20[];
} = {
  [NetworkName.Ethereum]: [
    {
      searchStr: "ethereum|eth",
      name: "Ether",
      symbol: "ETH",
      address: NETWORK_CONFIG[NetworkName.Ethereum].baseToken.wrappedAddress,
      icon: TokenIconKey.ImageTokenEthKey,
      decimals: 18,
      isBaseToken: true,
    },
    {
      name: "RAIL",
      symbol: "RAIL",
      logoURI:
        "https://assets.coingecko.com/coins/images/16840/large/railgun.jpeg?1625322775",
      searchStr: "railgun|rail",
      address: "0xe76c6c83af64e4c60245d8c7de953df673a7a33d",
      decimals: 18,
    },
    {
      name: "Tether",
      symbol: "USDT",
      logoURI:
        "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png?1598003707",
      searchStr: "tether|usdt",
      address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
      decimals: 6,
    },
    {
      name: "USD Coin",
      symbol: "USDC",
      logoURI:
        "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389",
      searchStr: "usd coin|usdc",
      address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      decimals: 6,
    },
    {
      name: "Binance USD",
      symbol: "BUSD",
      logoURI:
        "https://assets.coingecko.com/coins/images/9576/large/BUSD.png?1568947766",
      searchStr: "binance usd|busd",
      address: "0x4fabb145d64652a948d72533023f6e7a623c7c53",
      decimals: 18,
    },
    {
      name: "Wrapped Bitcoin",
      symbol: "WBTC",
      logoURI:
        "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png?1548822744",
      searchStr: "wrapped bitcoin|wbtc",
      address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
      decimals: 8,
    },
    {
      name: "Shiba Inu",
      symbol: "SHIB",
      logoURI:
        "https://assets.coingecko.com/coins/images/11939/large/shiba.png?1622619446",
      searchStr: "shiba inu|shib",
      address: "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce",
      decimals: 18,
    },
    {
      name: "Dai",
      symbol: "DAI",
      logoURI:
        "https://assets.coingecko.com/coins/images/9956/large/4943.png?1636636734",
      searchStr: "dai|dai",
      address: "0x6b175474e89094c44da98b954eedeac495271d0f",
      decimals: 18,
    },
    {
      name: "Polygon",
      symbol: "MATIC",
      logoURI:
        "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png?1624446912",
      searchStr: "polygon|matic",
      address: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
      decimals: 18,
    },
    {
      address: "0x514910771af9ca656af840dff83e8264ecf986ca",
      name: "Chainlink",
      symbol: "LINK",
      decimals: 18,
      logoURI:
        "https://assets.coingecko.com/coins/images/877/thumb/chainlink-new-logo.png?1547034700",
      searchStr: "chainlink|link",
    },
  ],
  [NetworkName.BNBChain]: [
    {
      searchStr: "binance coin|bnb",
      name: "Binance Coin",
      symbol: "BNB",
      address: NETWORK_CONFIG[NetworkName.BNBChain].baseToken.wrappedAddress,
      icon: TokenIconKey.ImageTokenBnbKey,
      decimals: 18,
      isBaseToken: true,
    },
    {
      name: "RAILBSC",
      symbol: "RAILBSC",
      logoURI:
        "https://assets.coingecko.com/coins/images/16840/large/railgun.jpeg?1625322775",
      searchStr: "railgun|railbsc",
      address: "0x3f847b01d4d498a293e3197b186356039ecd737f",
      decimals: 18,
    },
    {
      name: "Tether",
      symbol: "USDT",
      logoURI:
        "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png?1598003707",
      searchStr: "tether|usdt",
      address: "0x55d398326f99059ff775485246999027b3197955",
      decimals: 18,
    },
    {
      name: "USD Coin",
      symbol: "USDC",
      logoURI:
        "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389",
      searchStr: "usd coin|usdc",
      address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
      decimals: 18,
    },
    {
      name: "Binance USD",
      symbol: "BUSD",
      logoURI:
        "https://assets.coingecko.com/coins/images/9576/large/BUSD.png?1568947766",
      searchStr: "binance usd|busd",
      address: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
      decimals: 18,
    },
    {
      name: "Dogecoin",
      symbol: "DOGE",
      logoURI:
        "https://assets.coingecko.com/coins/images/5/large/dogecoin.png?1547792256",
      searchStr: "dogecoin|doge",
      address: "0x4206931337dc273a630d328da6441786bfad668f",
      decimals: 8,
    },
    {
      name: "Dai",
      symbol: "DAI",
      logoURI:
        "https://assets.coingecko.com/coins/images/9956/large/4943.png?1636636734",
      searchStr: "dai|dai",
      address: "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3",
      decimals: 18,
    },
    {
      name: "Polygon",
      symbol: "MATIC",
      logoURI:
        "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png?1624446912",
      searchStr: "polygon|matic",
      address: "0xcc42724c6683b7e57334c4e856f4c9965ed682bd",
      decimals: 18,
    },
    {
      name: "Chainlink",
      symbol: "LINK",
      logoURI:
        "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png?1547034700",
      searchStr: "chainlink|link",
      address: "0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd",
      decimals: 18,
    },
    {
      name: "Cosmos Hub",
      symbol: "ATOM",
      logoURI:
        "https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png?1555657960",
      searchStr: "cosmos hub|atom",
      address: "0x0eb3a705fc54725037cc9e008bdede697f62f335",
      decimals: 18,
    },
    {
      name: "Uniswap",
      symbol: "UNI",
      logoURI:
        "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png?1600306604",
      searchStr: "uniswap|uni",
      address: "0xbf5140a22578168fd562dccf235e5d43a02ce9b1",
      decimals: 18,
    },
  ],
  [NetworkName.Polygon]: [
    {
      searchStr: "polygon|matic",
      name: "Polygon",
      symbol: "MATIC",
      address: NETWORK_CONFIG[NetworkName.Polygon].baseToken.wrappedAddress,
      icon: TokenIconKey.ImageTokenMaticKey,
      decimals: 18,
      isBaseToken: true,
    },
    {
      name: "RAILPOLY",
      symbol: "RAILPOLY",
      logoURI:
        "https://assets.coingecko.com/coins/images/16840/large/railgun.jpeg?1625322775",
      searchStr: "railgun|railpoly",
      address: "0x92A9C92C215092720C731c96D4Ff508c831a714f",
      decimals: 18,
    },
    {
      name: "Tether",
      symbol: "USDT",
      logoURI:
        "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png?1598003707",
      searchStr: "tether|usdt",
      address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
      decimals: 6,
    },
    {
      name: "USD Coin",
      symbol: "USDC",
      logoURI:
        "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389",
      searchStr: "usd coin|usdc",
      address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
      decimals: 6,
    },
    {
      name: "Binance USD",
      symbol: "BUSD",
      logoURI:
        "https://assets.coingecko.com/coins/images/9576/large/BUSD.png?1568947766",
      searchStr: "binance usd|busd",
      address: "0x9fb83c0635de2e815fd1c21b3a292277540c2e8d",
      decimals: 18,
    },
    {
      name: "Avalanche",
      symbol: "AVAX",
      logoURI:
        "https://assets.coingecko.com/coins/images/12559/large/coin-round-red.png?1604021818",
      searchStr: "avalanche|avax",
      address: "0x2c89bbc92bd86f8075d1decc58c7f4e0107f286b",
      decimals: 18,
    },
    {
      name: "Wrapped Bitcoin",
      symbol: "WBTC",
      logoURI:
        "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png?1548822744",
      searchStr: "wrapped bitcoin|wbtc",
      address: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
      decimals: 8,
    },
    {
      name: "Dai",
      symbol: "DAI",
      logoURI:
        "https://assets.coingecko.com/coins/images/9956/large/4943.png?1636636734",
      searchStr: "dai|dai",
      address: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
      decimals: 18,
    },
    {
      name: "Chainlink",
      symbol: "LINK",
      logoURI:
        "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png?1547034700",
      searchStr: "chainlink|link",
      address: "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39",
      decimals: 18,
    },
  ],
  [NetworkName.Arbitrum]: [
    {
      name: "Tether USD",
      symbol: "USDT",
      logoURI:
        "https://assets.coingecko.com/coins/images/325/large/Tether.png?1668148663",
      decimals: 6,
      searchStr: "tether usd|usdt",
      address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    },
    {
      name: "Dai Stablecoin",
      symbol: "DAI",
      logoURI:
        "https://assets.coingecko.com/coins/images/9956/large/4943.png?1636636734",
      decimals: 18,
      searchStr: "dai stablecoin|dai",
      address: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
    },
    {
      searchStr: "usd coin|usdc",
      name: "USD Coin",
      symbol: "USDC",
      address: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
      icon: TokenIconKey.ImageTokenUsdcKey,
      decimals: 6,
    },
    {
      name: "Wrapped BTC",
      symbol: "WBTC",
      logoURI:
        "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png?1548822744",
      decimals: 8,
      searchStr: "wrapped btc|wbtc",
      address: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
    },
    {
      name: "Matic Token",
      symbol: "MATIC",
      logoURI:
        "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png?1624446912",
      decimals: 18,
      searchStr: "matic token|matic",
      address: "0x561877b6b3dd7651313794e5f2894b2f18be0766",
    },
    {
      name: "ChainLink Token",
      symbol: "LINK",
      logoURI:
        "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png?1547034700",
      decimals: 18,
      searchStr: "chainlink token|link",
      address: "0xf97f4df75117a78c1a5a0dbb814af92458539fb4",
    },
    {
      name: "Aave Token",
      symbol: "AAVE",
      logoURI:
        "https://assets.coingecko.com/coins/images/12645/large/AAVE.png?1601374110",
      decimals: 18,
      searchStr: "aave token|aave",
      address: "0xba5ddd1f9d7f570dc94a51479a000e3bce967196",
    },
  ],
  [NetworkName.EthereumRopsten_DEPRECATED]: [
    {
      searchStr: "ethereum|eth",
      name: "Ether",
      symbol: "ETH",
      address:
        NETWORK_CONFIG[NetworkName.EthereumRopsten_DEPRECATED].baseToken
          .wrappedAddress,
      icon: TokenIconKey.ImageTokenEthKey,
      decimals: 18,
      isBaseToken: true,
    },
    {
      address: "0x23de31d98d78084de626659f752058266feb69a5",
      symbol: "STABLE",
      name: "Stable Coin",
      decimals: 18,
      searchStr: "stable coin|stable",
    },
    {
      address: "0x029ff5466955779f531c59fd43ef4951c0711422",
      symbol: "VOTE",
      name: "Governance Token",
      decimals: 18,
      searchStr: "governance token|vote",
    },
    {
      address: "0x948cf6dc245d7f99edf4a327404f1fb3fe6549e7",
      symbol: "SEC",
      name: "Security",
      decimals: 18,
      searchStr: "security|sec",
    },
    {
      address: "0x7aac4d2b6f111790a0842f92b895f4dbe1e884e4",
      symbol: "FOOD",
      name: "Food Token",
      decimals: 18,
      searchStr: "food token|food",
    },
  ],
  [NetworkName.EthereumGoerli_DEPRECATED]: [
    {
      searchStr: "ethereum|eth",
      name: "Ether",
      symbol: "ETH",
      address:
        NETWORK_CONFIG[NetworkName.EthereumGoerli_DEPRECATED].baseToken
          .wrappedAddress,
      icon: TokenIconKey.ImageTokenEthKey,
      decimals: 18,
      isBaseToken: true,
    },
    {
      searchStr: "dai|dai",
      name: "Dai",
      symbol: "DAI",
      address: "0xdc31ee1784292379fbb2964b3b9c4124d8f89c60",
      icon: TokenIconKey.ImageTokenDaiKey,
      decimals: 18,
    },
    {
      searchStr: "usd coin|usdc",
      name: "USD Coin",
      symbol: "USDC",
      address: "0x07865c6e87b9f70255377e024ace6630c1eaa37f",
      icon: TokenIconKey.ImageTokenUsdcKey,
      decimals: 6,
    },
  ],
  [NetworkName.EthereumSepolia]: [
    {
      searchStr: "ethereum|eth",
      name: "Ether",
      symbol: "ETH",
      address:
        NETWORK_CONFIG[NetworkName.EthereumSepolia].baseToken.wrappedAddress,
      icon: TokenIconKey.ImageTokenEthKey,
      decimals: 18,
      isBaseToken: true,
    },
    {
      searchStr: "dai|dai",
      name: "Dai",
      symbol: "DAI",
      address: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6",
      icon: TokenIconKey.ImageTokenDaiKey,
      decimals: 18,
    },
    {
      searchStr: "usd coin|usdc",
      name: "Tether",
      symbol: "USDT",
      address: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
      icon: TokenIconKey.ImageTokenUsdtKey,
      decimals: 6,
    },
    {
      searchStr: "usd coin|usdc",
      name: "USD Coin",
      symbol: "USDC",
      address: "0x8267cF9254734C6Eb452a7bb9AAF97B392258b21",
      icon: TokenIconKey.ImageTokenUsdcKey,
      decimals: 18,
    },
  ],
  [NetworkName.PolygonMumbai_DEPRECATED]: [
    {
      searchStr: "polygon|matic",
      name: "Polygon",
      symbol: "MATIC",
      address:
        NETWORK_CONFIG[NetworkName.PolygonMumbai_DEPRECATED].baseToken
          .wrappedAddress,
      icon: TokenIconKey.ImageTokenMaticKey,
      decimals: 18,
      isBaseToken: true,
    },
    {
      searchStr: "wrapped ether|weth",
      name: "Wrapped Ether",
      symbol: "WETH",
      address: "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa",
      icon: TokenIconKey.ImageTokenWethKey,
      decimals: 18,
    },
    {
      searchStr: "usd coin|usdc",
      name: "USD Coin",
      symbol: "USDC",
      address: "0xE097d6B3100777DC31B34dC2c58fB524C2e76921",
      icon: TokenIconKey.ImageTokenUsdcKey,
      decimals: 6,
    },
    {
      name: "Tether",
      symbol: "USDT",
      logoURI:
        "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png?1598003707",
      searchStr: "tether|usdt",
      address: "0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832",
      decimals: 6,
    },
  ],
  [NetworkName.ArbitrumGoerli_DEPRECATED]: [
    {
      searchStr: "usd coin|usdc",
      name: "USD Coin",
      symbol: "USDC",
      address: "0x179522635726710Dd7D2035a81d856de4Aa7836c",
      icon: TokenIconKey.ImageTokenUsdcKey,
      decimals: 6,
    },
    {
      name: "Dai",
      symbol: "DAI",
      logoURI:
        "https://assets.coingecko.com/coins/images/9956/large/4943.png?1636636734",
      decimals: 18,
      searchStr: "dai|dai",
      address: "0xc52f941486978a25fad837bb701d3025679780e4",
    },
    {
      name: "WETH",
      symbol: "WETH",
      logoURI:
        "https://assets.coingecko.com/coins/images/2518/large/weth.png?1628852295",
      decimals: 18,
      searchStr: "weth|weth",
      address: "0xe39ab88f8a4777030a534146a9ca3b52bd5d43a3",
    },
  ],
  [NetworkName.Hardhat]: [
    {
      searchStr: "ethereum|eth",
      name: "Ether",
      symbol: "ETH",
      address: NETWORK_CONFIG[NetworkName.Hardhat].baseToken.wrappedAddress,
      icon: TokenIconKey.ImageTokenEthKey,
      decimals: 18,
      isBaseToken: true,
    },
  ],
  [NetworkName.PolygonAmoy]: [
    {
      searchStr: "polygon|matic",
      name: "Polygon",
      symbol: "MATIC",
      address: NETWORK_CONFIG[NetworkName.PolygonAmoy].baseToken.wrappedAddress,
      icon: TokenIconKey.ImageTokenMaticKey,
      decimals: 18,
      isBaseToken: true,
    },
  ],
};

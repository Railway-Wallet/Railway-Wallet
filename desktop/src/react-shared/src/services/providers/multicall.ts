import { NetworkName } from '@railgun-community/shared-models';
import { Contract, Interface, JsonRpcProvider } from 'ethers';

const MULTICALL3_ABI = [
  'function aggregate(tuple(address target, bytes callData)[] calls) public returns (uint256 blockNumber, bytes[] returnData)',
];

const MULTICALL3_ADDRESS: Partial<Record<NetworkName, string>> = {
  [NetworkName.Ethereum]: '0xca11bde05977b3631167028862be2a173976ca11',
  [NetworkName.EthereumSepolia]: '0xca11bde05977b3631167028862be2a173976ca11',
  [NetworkName.Arbitrum]: '0xca11bde05977b3631167028862be2a173976ca11',
  [NetworkName.Polygon]: '0xca11bde05977b3631167028862be2a173976ca11',
  [NetworkName.BNBChain]: '0xca11bde05977b3631167028862be2a173976ca11',
};

const ERC20_IFACE = new Interface([
  'function balanceOf(address) view returns (uint256)',
]);

export const multicallERC20BalanceOf = async (
  provider: JsonRpcProvider,
  networkName: NetworkName,
  walletAddress: string,
  tokenAddresses: string[],
): Promise<MapType<bigint> | undefined> => {
  const multicallAddress = MULTICALL3_ADDRESS[networkName] ?? '';
  if (multicallAddress.length === 0) return undefined;
  try {
    const contract = new Contract(multicallAddress, MULTICALL3_ABI, provider);
    const calls = tokenAddresses.map(addr => ({
      target: addr,
      callData: ERC20_IFACE.encodeFunctionData('balanceOf', [walletAddress]),
    }));
    const result = await contract.aggregate(calls);
    const returnData: string[] = result[1] as string[];
    const balances: MapType<bigint> = {};
    for (let i = 0; i < tokenAddresses.length; i += 1) {
      const data = returnData[i];
      if (typeof data !== 'string') continue;
      try {
        const [decoded] = ERC20_IFACE.decodeFunctionResult('balanceOf', data);
        balances[tokenAddresses[i].toLowerCase()] = BigInt(decoded.toString());
      } catch {}
    }
    return balances;
  } catch {
    return undefined;
  }
};


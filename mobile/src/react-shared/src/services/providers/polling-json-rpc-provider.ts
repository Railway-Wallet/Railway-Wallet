import { JsonRpcApiProviderOptions, JsonRpcProvider, Network } from "ethers";

export class PollingJsonRpcProvider extends JsonRpcProvider {
  constructor(
    url: string,
    chainId: number,
    pollingInterval = 10000,
    maxLogsPerBatch = 100
  ) {
    const network = Network.from(chainId);
    const options: JsonRpcApiProviderOptions = {
      polling: true,
      staticNetwork: network,
      batchMaxCount: maxLogsPerBatch,
    };
    super(url, network, options);
    this.pollingInterval = pollingInterval;
  }
}

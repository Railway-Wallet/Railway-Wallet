import { ERC20Amount } from './token';

export type RelayerFeeInfo = {
  relayerFeeText: string;
  relayerFeeSubtext: string;
  relayerFeeERC20Amount: Optional<ERC20Amount>;
  relayerFeeIsEstimating: boolean;
};

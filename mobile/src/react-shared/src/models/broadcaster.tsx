import { ERC20Amount } from "./token";

export type BroadcasterFeeInfo = {
  broadcasterFeeText: string;
  broadcasterFeeSubtext: string;
  broadcasterFeeERC20Amount: Optional<ERC20Amount>;
  broadcasterFeeIsEstimating: boolean;
};

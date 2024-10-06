import { populateCrossContractCalls } from "../../bridge/bridge-cross-contract-calls";
import {
  gasEstimateForShield,
  gasEstimateForShieldBaseToken,
  populateShield,
  populateShieldBaseToken,
} from "../../bridge/bridge-shield";
import {
  populateProvedUnshield,
  populateProvedUnshieldBaseToken,
  populateProvedUnshieldToOrigin,
} from "../../bridge/bridge-unshield-transfer";

export class UnauthenticatedWalletService {
  populateRailgunCrossContractCalls = populateCrossContractCalls;
  populateRailgunProvedUnshieldBaseToken = populateProvedUnshieldBaseToken;
  populateRailgunProvedUnshield = populateProvedUnshield;
  populateRailgunProvedUnshieldToOrigin = populateProvedUnshieldToOrigin;
  populateRailgunShield = populateShield;
  populateRailgunShieldBaseToken = populateShieldBaseToken;
  getRailgunGasEstimateForShield = gasEstimateForShield;
  getRailgunGasEstimateForShieldBaseToken = gasEstimateForShieldBaseToken;
}

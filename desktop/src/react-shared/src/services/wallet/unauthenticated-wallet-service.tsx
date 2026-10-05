import { populateCrossContractCalls } from '../../bridge/bridge-cross-contract-calls';
import {
  getEphemeralKeyIndex as bridgeGetEphemeralKeyIndex,
  ratchetEphemeralAddress as bridgeRatchetEphemeralAddress,
} from '../../bridge/bridge-ephemeral';
import {
  gasEstimateForShield,
  gasEstimateForShieldBaseToken,
  populateShield,
  populateShieldBaseToken,
} from '../../bridge/bridge-shield';
import {
  populateProvedUnshield,
  populateProvedUnshieldBaseToken,
  populateProvedUnshieldToOrigin,
} from '../../bridge/bridge-unshield-transfer';

export class UnauthenticatedWalletService {
  populateRailgunCrossContractCalls = populateCrossContractCalls;
  populateRailgunProvedUnshieldBaseToken = populateProvedUnshieldBaseToken;
  populateRailgunProvedUnshield = populateProvedUnshield;
  populateRailgunProvedUnshieldToOrigin = populateProvedUnshieldToOrigin;
  populateRailgunShield = populateShield;
  populateRailgunShieldBaseToken = populateShieldBaseToken;
  getRailgunGasEstimateForShield = gasEstimateForShield;
  getRailgunGasEstimateForShieldBaseToken = gasEstimateForShieldBaseToken;
  ratchetEphemeralAddress = bridgeRatchetEphemeralAddress;
  getEphemeralKeyIndex = bridgeGetEphemeralKeyIndex;
}

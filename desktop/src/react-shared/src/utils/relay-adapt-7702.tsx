import { ContractTransaction } from 'ethers';
import { SerializedEIP7702Authorization } from '../models/bridge';

export const hydrateRelayAdapt7702Authorization = (
  transaction: ContractTransaction,
  authorization: SerializedEIP7702Authorization,
): void => {
  (
    transaction as unknown as { authorizationList?: unknown[] }
  ).authorizationList = [
    {
      address: authorization.address,
      nonce: authorization.nonce,
      chainId: authorization.chainId,
      signature: {
        r: authorization.r,
        s: authorization.s,
        yParity: authorization.yParity,
      },
    },
  ];
};

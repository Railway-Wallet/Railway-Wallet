import { useMemo } from "react";
import { SelectTokenPurpose } from "../../models/token";
import { TransactionType } from "../../models/transaction";
import { getERC20TokensForNetwork } from "../../services/wallet/wallet-balance-service";
import { useReduxSelector } from "../hooks-redux";

export const useSelectableTokens = (
  purpose: SelectTokenPurpose,
  transactionType: TransactionType | null,
  skipBaseToken: boolean,
  hasExistingTokenAmounts: boolean = false
) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const activeWallet = wallets.active;

  const walletTokens = useMemo(
    () => getERC20TokensForNetwork(activeWallet, network.current.name),
    [activeWallet, network]
  );

  const addedTokens = useMemo(
    () =>
      walletTokens
        .filter((token) => !((token.isBaseToken ?? false) && skipBaseToken))
        .filter((token) => {
          if (purpose === SelectTokenPurpose.Transfer) {
            if (
              transactionType === TransactionType.Unshield &&
              (token.isBaseToken ?? false)
            ) {
              return false;
            }
          }
          return true;
        })
        .filter((token) => {
          if (
            purpose === SelectTokenPurpose.Transfer &&
            hasExistingTokenAmounts
          ) {
            if (
              transactionType === TransactionType.Shield &&
              (token.isBaseToken ?? false)
            ) {
              return false;
            }
          }
          return true;
        }),
    [
      hasExistingTokenAmounts,
      purpose,
      skipBaseToken,
      transactionType,
      walletTokens,
    ]
  );

  return { addedTokens };
};

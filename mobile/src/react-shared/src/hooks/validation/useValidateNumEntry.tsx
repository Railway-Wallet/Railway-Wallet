import { isDefined } from "@railgun-community/shared-models";
import { useEffect, useState } from "react";
import { ERC20Token } from "../../models/token";
import { TransactionType } from "../../models/transaction";
import { getTokenDisplayName, isValidTokenEntry } from "../../utils/tokens";
import { maxBalanceAvailableToShield } from "../../utils/transactions";
import { stringEntryToBigInt } from "../../utils/util";
import { useRailgunFees } from "../formatting/useRailgunFees";
import { useReduxSelector } from "../hooks-redux";

export const useValidateNumEntry = (
  setError: (error?: Error) => void,
  numEntry: string | bigint,
  tokenAllowance: Optional<bigint>,
  requiresApproval: boolean,
  tokenBalance: bigint,
  transactionType: TransactionType,
  currentToken: Optional<ERC20Token>,
  isRailgunBalance: boolean
) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const [hasValidNumEntry, setHasValidNumEntry] = useState(false);
  const [disableNumPad, setDisableNumPad] = useState(false);

  const { shieldFee } = useRailgunFees(transactionType);

  const activeWallet = wallets.active;
  const availableWallets = wallets.available;

  useEffect(() => {
    const validateEntries = () => {
      if (!activeWallet) {
        setHasValidNumEntry(false);
        setError(new Error("Please connect a wallet."));
        setDisableNumPad(true);
        return;
      }

      if (!currentToken) {
        setHasValidNumEntry(false);
        setError(new Error("No token selected."));
        setDisableNumPad(true);
        return;
      }

      setDisableNumPad(false);

      const numEntryIsString = typeof numEntry === "string";
      if (numEntryIsString) {
        if (!numEntry.length) {
          setError();
          setHasValidNumEntry(false);
          return;
        }
        if (!isValidTokenEntry(numEntry, currentToken)) {
          setError(new Error("Invalid amount."));
          setHasValidNumEntry(false);
          return;
        }
      }

      const numEntryBigNumber = numEntryIsString
        ? stringEntryToBigInt(numEntry, currentToken.decimals)
        : numEntry;

      if (numEntryBigNumber <= 0n) {
        setError();
        setHasValidNumEntry(false);
        return;
      }

      if (numEntryBigNumber > tokenBalance) {
        setError(
          new Error(
            `Insufficient ${
              isRailgunBalance ? "private" : "public"
            } ${getTokenDisplayName(
              currentToken,
              availableWallets,
              network.current.name
            )} balance.`
          )
        );
        setHasValidNumEntry(false);
        return;
      }

      if (transactionType === TransactionType.Shield) {
        const maxAvailableToShield = maxBalanceAvailableToShield(
          tokenBalance,
          shieldFee
        );
        if (numEntryBigNumber > maxAvailableToShield) {
          setError(
            new Error(
              `Insufficient ${
                isRailgunBalance ? "private" : "public"
              } ${getTokenDisplayName(
                currentToken,
                availableWallets,
                network.current.name
              )} balance.`
            )
          );
          setHasValidNumEntry(false);
          return;
        }
      }

      if (
        requiresApproval &&
        isDefined(tokenAllowance) &&
        tokenAllowance < numEntryBigNumber
      ) {
        setError(new Error(`Requires approval.`));
        setHasValidNumEntry(false);
        return;
      }

      setError();
      setHasValidNumEntry(true);
    };

    validateEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    shieldFee,
    activeWallet,
    tokenBalance,
    numEntry,
    requiresApproval,
    currentToken,
    transactionType,
    tokenAllowance,
    network,
    setError,
  ]);

  return { hasValidNumEntry, disableNumPad };
};

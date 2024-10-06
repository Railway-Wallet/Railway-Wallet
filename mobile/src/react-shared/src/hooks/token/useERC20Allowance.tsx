import { isDefined } from "@railgun-community/shared-models";
import { useEffect, useRef, useState } from "react";
import { ERC20Token } from "../../models/token";
import { TransactionType } from "../../models/transaction";
import { getERC20SpenderAllowance } from "../../services/token/erc20-allowance";
import { requiresTokenApproval } from "../../utils/util";
import { useAppDispatch, useReduxSelector } from "../hooks-redux";
import { usePendingApproveERC20Transaction } from "../saved-transactions/usePendingApproveERC20Transaction";

const NULL_SPENDER = "0x0000000000000000000000000000000000000000";

export const useERC20Allowance = (
  currentToken: Optional<ERC20Token>,
  transactionType: TransactionType,
  spender: Optional<string>,
  isPrivate: boolean,
  setError: (error: Error) => void
) => {
  const dispatch = useAppDispatch();
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const [erc20Allowance, setERC20Allowance] = useState<Optional<bigint>>();

  const currentTokenRef = useRef<Optional<ERC20Token>>(undefined);
  const spenderRef = useRef<Optional<string>>(undefined);

  const networkName = network.current.name;

  const requiresApproval =
    isDefined(currentToken) &&
    requiresTokenApproval(transactionType, isPrivate, currentToken.isBaseToken);

  const { pendingApproveERC20Transaction } = usePendingApproveERC20Transaction(
    networkName,
    currentToken?.address,
    spender
  );

  useEffect(() => {
    currentTokenRef.current = currentToken;
    spenderRef.current = spender;

    const updateERC20Allowance = async () => {
      if (!requiresApproval) {
        return;
      }
      if (!isDefined(spender) || spender === NULL_SPENDER) {
        setError(new Error("No spender"));
        setERC20Allowance(undefined);
        return;
      }
      if (isDefined(wallets.active) && wallets.active.isViewOnlyWallet) {
        setError(new Error("View-only wallet cannot have allowance"));
        return;
      }

      const allowance = await getERC20SpenderAllowance(
        dispatch,
        networkName,
        wallets.active?.ethAddress,
        currentToken,
        spender
      );

      if (
        currentTokenRef.current?.address === currentToken?.address &&
        spenderRef.current === spender
      ) {
        setERC20Allowance(allowance);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateERC20Allowance();
  }, [
    currentToken,
    pendingApproveERC20Transaction,
    requiresApproval,
    spender,
    dispatch,
    networkName,
    wallets.active,
    setError,
  ]);

  const resetERC20Allowance = () => {
    setERC20Allowance(undefined);
  };

  return {
    erc20Allowance,
    pendingApproveERC20Transaction,
    resetERC20Allowance,
    requiresApproval,
  };
};

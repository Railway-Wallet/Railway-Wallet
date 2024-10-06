import { isDefined, NFTAmount } from "@railgun-community/shared-models";
import { useCallback, useEffect, useRef, useState } from "react";
import { TransactionType } from "../../models/transaction";
import { getNFTCollectionApprovedForSpender } from "../../services/token/nft-allowance";
import { promiseTimeout } from "../../utils";
import { requiresTokenApproval } from "../../utils/util";
import { useAppDispatch, useReduxSelector } from "../hooks-redux";
import { usePendingApproveNFTCollectionTransaction } from "../saved-transactions/usePendingApproveNFTCollectionTransaction";

const NULL_SPENDER = "0x0000000000000000000000000000000000000000";

export const useNFTCollectionApproved = (
  currentNFTAmount: Optional<NFTAmount>,
  transactionType: TransactionType,
  spender: Optional<string>,
  isPrivate: boolean,
  setError: (error: Error) => void
) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const dispatch = useAppDispatch();

  const [nftApproved, setNFTApproved] = useState<Optional<boolean>>();

  const currentNFTAmountRef = useRef<Optional<NFTAmount>>(undefined);
  const spenderRef = useRef<Optional<string>>(undefined);

  const networkName = network.current.name;

  const requiresApproval =
    isDefined(currentNFTAmount) &&
    requiresTokenApproval(transactionType, isPrivate, false);

  const { pendingApproveNFTCollectionTransaction } =
    usePendingApproveNFTCollectionTransaction(
      networkName,
      currentNFTAmount?.nftAddress,
      spender
    );

  const updateNFTAllowance = useCallback(async () => {
    currentNFTAmountRef.current = currentNFTAmount;
    spenderRef.current = spender;

    if (!isDefined(spender) || spender === NULL_SPENDER) {
      setError(new Error("Requires spender contract"));
      setNFTApproved(false);
      return;
    }
    if (isDefined(wallets.active) && wallets.active.isViewOnlyWallet) {
      setError(new Error("View-only wallet cannot have allowance"));
      setNFTApproved(false);
      return;
    }

    try {
      const approved = await promiseTimeout(
        getNFTCollectionApprovedForSpender(
          dispatch,
          networkName,
          wallets.active?.ethAddress,
          currentNFTAmount,
          spender
        ),
        5000
      );

      if (
        currentNFTAmountRef.current?.nftAddress ===
          currentNFTAmount?.nftAddress &&
        spenderRef.current === spender
      ) {
        setNFTApproved(approved);
      }
    } catch (err) {
      setError(
        new Error(
          "Unable to get NFT collection approval data. This may not be a valid NFT collection."
        )
      );
      setNFTApproved(false);
    }
  }, [
    currentNFTAmount,
    dispatch,
    networkName,
    setError,
    spender,
    wallets.active,
  ]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateNFTAllowance();
  }, [updateNFTAllowance, pendingApproveNFTCollectionTransaction]);

  const resetNFTApproved = async () => {
    setNFTApproved(undefined);
    await updateNFTAllowance();
  };

  return {
    nftApproved,
    pendingApproveNFTCollectionTransaction,
    resetNFTApproved,
    requiresApproval,
  };
};

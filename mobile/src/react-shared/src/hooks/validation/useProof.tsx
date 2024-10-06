import {
  isDefined,
  NFTAmountRecipient,
  SelectedBroadcaster,
} from "@railgun-community/shared-models";
import { useCallback, useEffect, useRef, useState } from "react";
import { ReactConfig } from "../../config/react-config";
import { SharedConstants } from "../../config/shared-constants";
import { ValidateProvedTransactionType } from "../../models/proof";
import { ERC20Amount, ERC20AmountRecipient } from "../../models/token";
import { TransactionType } from "../../models/transaction";
import { logDev } from "../../utils/logging";
import { createBroadcasterFeeERC20AmountRecipient } from "../../utils/tokens";
import { getProofTypeFromTransactionType } from "../../utils/transactions";
import { useReduxSelector } from "../hooks-redux";

export const useProof = (
  transactionType: TransactionType,
  requiresProofGeneration: boolean,
  showSenderAddressToRecipient: boolean,
  memoText: Optional<string>,
  erc20AmountRecipients: ERC20AmountRecipient[],
  nftAmountRecipients: NFTAmountRecipient[],
  isBaseTokenWithdraw: boolean,
  selectedBroadcaster: Optional<SelectedBroadcaster>,
  broadcasterFeeERC20Amount: Optional<ERC20Amount>,
  sendWithPublicWallet: boolean,
  overallBatchMinGasPrice: Optional<bigint>,
  setError: (err: Error) => void,
  lockBroadcaster: (shouldLock: boolean) => void,
  proofTimerExpired: () => void,
  validateProvedTransaction: ValidateProvedTransactionType
) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const [proofExpirationSeconds, setProofExpirationSeconds] =
    useState<Optional<number>>(undefined);
  const [showGenerateProofModal, setShowGenerateProofModal] = useState(false);
  const [hasValidProof, setHasValidProof] = useState(false);

  const proofExpirationTime = 240;
  const expirationTime = useRef<Optional<number>>();
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const invalidateProof = useCallback(() => {
    logDev("Invalidate proof.");
    setShowGenerateProofModal(false);
    lockBroadcaster(false);
    setHasValidProof(false);
    clearProofTimer();
  }, [lockBroadcaster]);

  useEffect(() => {
    const validateProof = async () => {
      if (requiresProofGeneration && !hasValidProof) {
        return;
      }
      if (ReactConfig.IS_DEV && SharedConstants.USE_FAKE_PROOF_IN_DEV) {
        return;
      }
      if (!wallets.active) {
        return;
      }
      if (!requiresProofGeneration || !hasValidProof) {
        return;
      }
      try {
        await validateProvedTransaction(
          network.current.name,
          getProofTypeFromTransactionType(transactionType, isBaseTokenWithdraw),
          wallets.active.railWalletID,
          showSenderAddressToRecipient,
          memoText,
          erc20AmountRecipients,
          nftAmountRecipients,
          sendWithPublicWallet
            ? undefined
            : createBroadcasterFeeERC20AmountRecipient(
                selectedBroadcaster,
                broadcasterFeeERC20Amount
              ),
          sendWithPublicWallet,
          overallBatchMinGasPrice
        );
      } catch (cause) {
        if (!(cause instanceof Error)) {
          throw cause;
        }
        setError(new Error("Proof failed validation checks.", { cause }));
        invalidateProof();
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    validateProof();
  }, [
    transactionType,
    hasValidProof,
    wallets.active,
    isBaseTokenWithdraw,
    requiresProofGeneration,
    selectedBroadcaster,
    broadcasterFeeERC20Amount,
    validateProvedTransaction,
    invalidateProof,
    network,
    setError,
    sendWithPublicWallet,
    memoText,
    erc20AmountRecipients,
    showSenderAddressToRecipient,
    overallBatchMinGasPrice,
    nftAmountRecipients,
  ]);

  useEffect(() => {
    return () => {
      clearProofTimer();
    };
  }, []);

  const clearProofTimer = () => {
    if (timer.current) {
      clearInterval(timer.current);
    }
    expirationTime.current = undefined;
    setProofExpirationSeconds(undefined);
  };

  const startTimer = () => {
    if (sendWithPublicWallet) {
      clearProofTimer();
      return;
    }
    if (!selectedBroadcaster) {
      invalidateProof();
      return;
    }

    clearProofTimer();
    expirationTime.current = Date.now() + proofExpirationTime * 1000;
    timer.current = setInterval(tick, 1000);
    tick();
  };

  const tick = () => {
    if (sendWithPublicWallet || !isDefined(expirationTime.current)) {
      return;
    }
    if (!selectedBroadcaster) {
      invalidateProof();
      return;
    }

    const secondsUntilExpiration = (expirationTime.current - Date.now()) / 1000;

    logDev(`Proof expires in: ${secondsUntilExpiration}`);

    if (secondsUntilExpiration <= 0) {
      clearProofTimer();
      proofTimerExpired();
      return;
    }
    setProofExpirationSeconds(Math.ceil(secondsUntilExpiration));
  };

  const onGenerateProofSuccess = () => {
    setShowGenerateProofModal(false);
    setHasValidProof(true);
    startTimer();
  };

  const onGenerateProofFail = (err: Error) => {
    lockBroadcaster(false);
    setShowGenerateProofModal(false);
    setError(err);
  };

  const tryGenerateProof = () => {
    if (!requiresProofGeneration) {
      return;
    }
    lockBroadcaster(true);
    if (ReactConfig.IS_DEV && SharedConstants.USE_FAKE_PROOF_IN_DEV) {
      onGenerateProofSuccess();
      return;
    }
    setShowGenerateProofModal(true);
  };

  return {
    hasValidProof,
    invalidateProof,
    clearProofTimer,
    proofExpirationSeconds,
    showGenerateProofModal,
    selectedBroadcaster,
    onGenerateProofSuccess,
    onGenerateProofFail,
    tryGenerateProof,
  };
};

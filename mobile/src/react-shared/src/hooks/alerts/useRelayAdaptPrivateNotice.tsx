import { isDefined } from "@railgun-community/shared-models";
import { TransactionType } from "../../models/transaction";
import { useRailgunFees } from "../formatting/useRailgunFees";

export const useRelayAdaptPrivateNotice = (
  isRailgun: boolean,
  transactionName: string,
  spender: string,
  noticePrefixText?: string
): { notice: string } => {
  const { shieldFee, unshieldFee } = useRailgunFees(
    TransactionType.Swap,
    isRailgun
  );

  if (!isRailgun) {
    return { notice: "" };
  }

  const feePercent = (feeString: string): number => {
    return Number(feeString) / 100;
  };

  const noticePrefix = isDefined(noticePrefixText)
    ? noticePrefixText.trim() + " "
    : "";

  const privateDisclaimerText =
    shieldFee === unshieldFee
      ? `${noticePrefix}You hold full custody of tokens during the ${transactionName} transaction, which uses the RAILGUN Relay Adapt contract to interact with ${spender}. After executing the ${transactionName}, the Relay Adapt smart contract will deposit the resulting tokens into your 0zk address. This action includes ${feePercent(
          shieldFee
        )}% shielding and unshielding fees.`
      : `${noticePrefix}You hold full custody of tokens during the ${transactionName} transaction, which uses the RAILGUN Relay Adapt contract to interact with ${spender}. After executing the ${transactionName}, the Relay Adapt smart contract will deposit the resulting tokens into your 0zk address. This action includes a fee of ${feePercent(
          unshieldFee
        )}% for unshielding and ${feePercent(shieldFee)}% for shielding.`;

  return { notice: privateDisclaimerText };
};

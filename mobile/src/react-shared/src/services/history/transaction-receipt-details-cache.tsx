import { isDefined } from "@railgun-community/shared-models";
import { SharedConstants } from "../../config/shared-constants";
import { TransactionReceiptDetails } from "../../models/transaction";
import { logDevError } from "../../utils/logging";
import { StorageService } from "../storage/storage-service";

export class TransactionReceiptDetailsCache {
  private getStorageKey = (txid: string) => {
    return `${SharedConstants.TRANSACTION_RECEIPT_DETAILS}|${txid}`;
  };

  getCached = async (
    txid: string
  ): Promise<Optional<TransactionReceiptDetails>> => {
    try {
      const txReceiptDetails = await StorageService.getItem(
        this.getStorageKey(txid)
      );
      if (isDefined(txReceiptDetails)) {
        const transactionReceiptDetails: TransactionReceiptDetails =
          JSON.parse(txReceiptDetails);
        if (
          isDefined(transactionReceiptDetails.timestamp) &&
          isDefined(transactionReceiptDetails.gasFeeString)
        ) {
          return transactionReceiptDetails;
        }
      }
      return undefined;
    } catch (err) {
      logDevError(err);
      return undefined;
    }
  };

  store = async (
    txid: string,
    txReceiptDetails: TransactionReceiptDetails
  ): Promise<void> => {
    await StorageService.setItem(
      this.getStorageKey(txid),
      JSON.stringify(txReceiptDetails)
    );
  };

  clear = async (txid: string): Promise<void> => {
    await StorageService.removeItem(this.getStorageKey(txid));
  };
}

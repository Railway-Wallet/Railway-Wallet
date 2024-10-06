import {
  isDefined,
  NetworkName,
  sanitizeError,
} from "@railgun-community/shared-models";
import { ToastType } from "../../models/toast";
import { ERC20Token } from "../../models/token";
import { showImmediateToast } from "../../redux-store/reducers/toast-reducer";
import { AppDispatch } from "../../redux-store/store";
import { logDevError } from "../../utils";
import { getTokenDisplayName } from "../../utils/tokens";
import { erc20Contract } from "../contract/contract";
import { ProviderService } from "../providers/provider-service";

export const getERC20SpenderAllowance = async (
  dispatch: AppDispatch,
  networkName: NetworkName,
  walletAddress: Optional<string>,
  token: Optional<ERC20Token>,
  spender: string
): Promise<bigint> => {
  if (!isDefined(walletAddress)) {
    return 0n;
  }
  if (!token || (token.isBaseToken ?? false)) {
    return 0n;
  }
  try {
    const provider = await ProviderService.getProvider(networkName);
    const erc20 = erc20Contract(token.address, provider);
    const allowance: bigint = await erc20.allowance(walletAddress, spender);
    return allowance;
  } catch (err) {
    logDevError(
      new Error("Error getting spender allowance for token", { cause: err })
    );
    if (!(err instanceof Error)) {
      throw err;
    }
    if (err.message.includes("provider destroyed")) return 0n;
    const error = sanitizeError(err);
    dispatch(
      showImmediateToast({
        message: `Error getting spender allowance for token ${getTokenDisplayName(
          token,
          undefined,
          networkName
        )}: ${error.message}`,
        type: ToastType.Error,
      })
    );
    return 0n;
  }
};

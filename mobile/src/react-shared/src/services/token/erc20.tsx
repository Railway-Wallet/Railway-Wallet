import {
  isDefined,
  Network,
  NetworkName,
  sanitizeError,
} from "@railgun-community/shared-models";
import { ToastType } from "../../models/toast";
import { ERC20Token } from "../../models/token";
import { showImmediateToast } from "../../redux-store/reducers/toast-reducer";
import { AppDispatch } from "../../redux-store/store";
import { logDevError } from "../../utils/logging";
import { getTokenDisplayName } from "../../utils/tokens";
import { erc20Contract } from "../contract/contract";
import { ProviderService } from "../providers/provider-service";
import { getWalletBaseTokenBalance } from "./base-token";
import { ERC20TokenDecimalsCache } from "./erc20-decimals-cache";

export const getERC20Balance = async (
  dispatch: AppDispatch,
  network: Network,
  walletAddress: Optional<string>,
  token: ERC20Token
): Promise<Optional<bigint>> => {
  if (!isDefined(walletAddress)) {
    return 0n;
  }
  const networkName = network.name;
  try {
    if (token.isBaseToken ?? false) {
      return getWalletBaseTokenBalance(networkName, walletAddress);
    }
    const provider = await ProviderService.getProvider(networkName);
    const erc20 = erc20Contract(token.address, provider);
    const balance: bigint = await erc20.balanceOf(walletAddress);
    return balance;
  } catch (err) {
    logDevError(new Error("Error getting ERC20 balance", { cause: err }));
    if (!(err instanceof Error)) {
      throw err;
    }
    if (err.message.includes("provider destroyed")) return 0n;
    if (window.navigator.onLine) {
      dispatch(
        showImmediateToast({
          message: `Error getting balance for ${getTokenDisplayName(
            token,
            undefined,
            networkName
          )} on ${network.publicName}: ${sanitizeError(err).message}`,
          type: ToastType.Error,
        })
      );
    }
    return 0n;
  }
};

export const getERC20Decimals = async (
  networkName: NetworkName,
  tokenAddress: string
): Promise<bigint> => {
  try {
    const tokenAddressLowercase = tokenAddress.toLowerCase();

    const cached = await ERC20TokenDecimalsCache.getCached(
      networkName,
      tokenAddressLowercase
    );
    if (isDefined(cached)) {
      return cached;
    }

    const provider = await ProviderService.getProvider(networkName);
    const erc20 = erc20Contract(tokenAddress, provider);
    const decimals = await erc20.decimals();

    await ERC20TokenDecimalsCache.store(
      networkName,
      tokenAddressLowercase,
      decimals
    );

    return decimals;
  } catch (err) {
    const error = new Error(
      `Failed to get ERC20 decimals for ${tokenAddress}`,
      {
        cause: err,
      }
    );
    logDevError(error);
    throw error;
  }
};

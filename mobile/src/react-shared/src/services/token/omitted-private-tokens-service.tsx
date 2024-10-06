import {
  isDefined,
  RailgunERC20Amount,
} from "@railgun-community/shared-models";
import { SharedConstants } from "../../config";
import {
  AvailableWallet,
  ERC20TokenAddressOnly,
  SearchableERC20,
} from "../../models";
import {
  AppDispatch,
  NetworkState,
  setOmittedPrivateTokens,
  setShouldShowOmittedPrivateTokensModal,
  store,
} from "../../redux-store";
import { StorageService } from "../storage";
import { getERC20TokenDetails, getFullERC20TokenInfo } from "./token-search";

export class OmittedPrivateTokensService {
  private dispatch: AppDispatch;

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  getOmittedPrivateTokensFromRailgunERC20Amounts = async (
    railgunERC20Amounts: RailgunERC20Amount[],
    availableWallets: Optional<AvailableWallet[]>,
    network: NetworkState
  ) => {
    const omittedPrivateTokensWithBalance = railgunERC20Amounts.filter(
      (erc20Amount) => erc20Amount.amount !== 0n
    );

    const searchableERC20OmittedPrivateTokens = await Promise.all(
      omittedPrivateTokensWithBalance.map(async (token) => {
        const tokenDecimals = Number(
          await getERC20TokenDetails(token.tokenAddress, network.current)
        );

        if (!availableWallets) {
          const unknownToken: SearchableERC20 = {
            address: token.tokenAddress,
            decimals: tokenDecimals,
            name: "",
            searchStr: "",
            symbol: "",
          };

          return unknownToken;
        }
        const addressOnlyToken: ERC20TokenAddressOnly = {
          address: token.tokenAddress,
          isAddressOnly: true,
          decimals: tokenDecimals,
        };

        return getFullERC20TokenInfo(
          addressOnlyToken,
          availableWallets,
          network.current
        );
      })
    );

    return searchableERC20OmittedPrivateTokens;
  };

  shouldShowOmittedPrivateTokensModal = async (shouldShowModal: boolean) => {
    this.dispatch(setShouldShowOmittedPrivateTokensModal(shouldShowModal));
  };

  handleFoundOmittedPrivateTokens = async (
    foundOmittedPrivateTokens: SearchableERC20[]
  ) => {
    const omittedPrivateTokensState = store.getState().omittedPrivateTokens;

    let shouldShowOmittedPrivateTokensModal =
      omittedPrivateTokensState.shouldShowOmittedPrivateTokensModal;
    let omittedPrivateTokens = omittedPrivateTokensState.omittedPrivateTokens;
    let unseenTokenAddresses;

    const foundedOmittedPrivateTokensAddresses = foundOmittedPrivateTokens.map(
      (token) => token.address
    );

    const seenTokenAddressesString = await StorageService.getItem(
      SharedConstants.HAS_SEEN_OMITTED_PRIVATE_TOKENS
    );
    const seenTokenAddresses: string[] = JSON.parse(
      seenTokenAddressesString as string
    );

    if (!isDefined(seenTokenAddresses)) {
      unseenTokenAddresses = foundedOmittedPrivateTokensAddresses;
    } else {
      unseenTokenAddresses = foundedOmittedPrivateTokensAddresses.filter(
        (tokenAddress) => !seenTokenAddresses.includes(tokenAddress)
      );
    }

    if (foundOmittedPrivateTokens.length > 0) {
      omittedPrivateTokens = foundOmittedPrivateTokens;
    }

    if (unseenTokenAddresses.length > 0) {
      await StorageService.setItem(
        SharedConstants.HAS_SEEN_OMITTED_PRIVATE_TOKENS,
        JSON.stringify([
          ...(isDefined(seenTokenAddresses) ? seenTokenAddresses : []),
          ...unseenTokenAddresses,
        ])
      );
      shouldShowOmittedPrivateTokensModal = true;
    }

    this.dispatch(
      setOmittedPrivateTokens({
        omittedPrivateTokens,
        shouldShowOmittedPrivateTokensModal,
      })
    );
  };
}

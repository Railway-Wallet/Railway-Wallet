import { isDefined } from "@railgun-community/shared-models";
import { useEffect } from "react";
import { formatUnits, parseUnits } from "ethers";
import {
  UpdatedTokenPrice,
  updateTokenPrices,
} from "../../redux-store/reducers/network-price-reducer";
import { AppSettingsService, getERC20TokensForNetwork } from "../../services";
import { compareTokenAddress, logDev } from "../../utils";
import { useAppDispatch, useReduxSelector } from "../hooks-redux";

export const useVaultRedeemTokenPriceUpdater = () => {
  const { network } = useReduxSelector("network");
  const { networkPrices } = useReduxSelector("networkPrices");
  const { vaults } = useReduxSelector("vaults");
  const { wallets } = useReduxSelector("wallets");

  const dispatch = useAppDispatch();

  const networkName = network.current.name;
  const activeWallet = wallets.active;

  const vaultsForNetwork = vaults.forNetwork[networkName];
  const currency = AppSettingsService.currency;
  const tokenPricesForNetwork =
    networkPrices.forNetwork[networkName]?.forCurrency[currency.code];
  const walletTokens = getERC20TokensForNetwork(activeWallet, networkName);

  useEffect(() => {
    if (!isDefined(vaultsForNetwork) || !isDefined(tokenPricesForNetwork)) {
      return;
    }

    const redeemTokenPrices: UpdatedTokenPrice[] = [];

    for (const token of walletTokens) {
      const tokenAddress = token.address.toLowerCase();

      const vault = vaultsForNetwork.redeemVaultForToken[tokenAddress];

      if (isDefined(vault)) {
        const depositTokenPrice =
          tokenPricesForNetwork[vault.depositERC20Address.toLowerCase()];

        if (!isDefined(depositTokenPrice)) {
          logDev(
            `Redeem token price calculation failed for ${vault.redeemERC20Symbol}. No corresponding deposit token (${vault.depositERC20Symbol}) in price map.`
          );
          continue;
        }

        const depositPriceBigInt = parseUnits(
          depositTokenPrice.toString(),
          vault.redeemERC20Decimals
        );

        const redeemPriceBigInt =
          (depositPriceBigInt * BigInt(vault.vaultRate)) /
          10n ** BigInt(vault.redeemERC20Decimals);

        const redeemTokenPrice = Number(
          formatUnits(redeemPriceBigInt, vault.redeemERC20Decimals)
        );

        const existingRedeemTokenPrice = tokenPricesForNetwork[tokenAddress];
        if (
          isDefined(existingRedeemTokenPrice) &&
          existingRedeemTokenPrice === redeemTokenPrice
        ) {
          continue;
        }

        redeemTokenPrices.push({
          tokenAddress,
          price: redeemTokenPrice,
        });
      }
    }

    if (redeemTokenPrices.length > 0) {
      const existingTokenPrices: UpdatedTokenPrice[] = Object.keys(
        tokenPricesForNetwork
      )
        .filter(
          (existingPriceTokenAddress) =>
            !redeemTokenPrices.some((redeemTokenPrice) =>
              compareTokenAddress(
                redeemTokenPrice.tokenAddress,
                existingPriceTokenAddress
              )
            )
        )
        .map((tokenAddress) => {
          return {
            tokenAddress,
            price: tokenPricesForNetwork[tokenAddress] ?? 0,
          };
        });

      dispatch(
        updateTokenPrices({
          networkName,
          updatedTokenPrices: [...existingTokenPrices, ...redeemTokenPrices],
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaultsForNetwork, tokenPricesForNetwork, walletTokens]);
};

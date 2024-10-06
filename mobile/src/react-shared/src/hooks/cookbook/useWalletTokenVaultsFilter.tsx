import { isDefined, NetworkName } from "@railgun-community/shared-models";
import { useMemo } from "react";
import { ERC20Token, FrontendWallet } from "../../models";
import { compareTokenAddress } from "../../utils";
import { useReduxSelector } from "../hooks-redux";

export const useWalletTokenVaultsFilter = (
  wallet: Optional<FrontendWallet>,
  networkName: NetworkName
) => {
  const { vaults } = useReduxSelector("vaults");

  const tokensForNetwork = wallet?.addedTokens[networkName];
  const networkVaultData = vaults.forNetwork[networkName];

  const { availableDepositTokens, availableRedeemTokens } = useMemo(() => {
    const supportedDepositTokens: ERC20Token[] = [];
    const supportedRedeemTokens: ERC20Token[] = [];

    if (!isDefined(tokensForNetwork) || networkVaultData === undefined) {
      return {
        availableDepositTokens: supportedDepositTokens,
        availableRedeemTokens: supportedRedeemTokens,
      };
    }

    for (const t of tokensForNetwork) {
      if (t.isBaseToken ?? false) continue;

      const hasVaultForDeposit = Object.keys(
        networkVaultData.depositVaultsForToken
      ).some((vaultDepositTokenAddress) =>
        compareTokenAddress(vaultDepositTokenAddress, t.address)
      );

      if (hasVaultForDeposit) {
        supportedDepositTokens.push(t);
      }

      const hasVaultForRedeem = Object.keys(
        networkVaultData.redeemVaultForToken
      ).some((vaultRedeemTokenAddress) =>
        compareTokenAddress(vaultRedeemTokenAddress, t.address)
      );

      if (hasVaultForRedeem) {
        supportedRedeemTokens.push(t);
      }
    }

    return {
      availableDepositTokens: supportedDepositTokens,
      availableRedeemTokens: supportedRedeemTokens,
    };
  }, [tokensForNetwork, networkVaultData]);

  return {
    availableDepositTokens,
    availableRedeemTokens,
  };
};

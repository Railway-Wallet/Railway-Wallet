import { BeefyAPI, BeefyVaultData } from "@railgun-community/cookbook";
import { isDefined, NetworkName } from "@railgun-community/shared-models";
import { AvailableWallet, FrontendWallet, TransactionType } from "../models";
import { CookbookFarmRecipeType } from "../models/cookbook";
import { ERC20Token, TokenIconKey } from "../models/token";
import { Vault, VaultType } from "../models/vault";
import { getTokenDisplayName } from "./tokens";
import {
  formatNumberToLocale,
  formatUnitFromHexStringToLocale,
  roundToNDecimals,
} from "./util";

export const getVaultDisplayName = (vaultType: VaultType) => {
  switch (vaultType) {
    case VaultType.Beefy:
      return "Beefy Vault";
  }
};

const getVaultAssetsButtonDisplayName = (vaultType: VaultType) => {
  switch (vaultType) {
    case VaultType.Beefy:
      return "Beefy Vaults";
  }
};

const getVaultAssetsUrl = (vaultType: VaultType) => {
  switch (vaultType) {
    case VaultType.Beefy:
      return "https://app.beefy.finance";
  }
};

const reverseVaultRate = (vault: Vault): bigint => {
  const oneUnit = 10n ** BigInt(vault.redeemERC20Decimals);
  const reversedVaultRate = (oneUnit * oneUnit) / BigInt(vault.vaultRate);
  return reversedVaultRate;
};

export const getVaultExchangeRateDisplayText = (
  vault: Optional<Vault>,
  transactionType: TransactionType
) => {
  if (!isDefined(vault)) {
    return "N/A";
  }
  const isFarmDeposit = transactionType === TransactionType.FarmDeposit;
  const vaultRate = isFarmDeposit
    ? reverseVaultRate(vault)
    : BigInt(vault.vaultRate);
  const exchangeRate = formatUnitFromHexStringToLocale(
    vaultRate,
    vault.redeemERC20Decimals
  );
  const exchangeRateText = formatNumberToLocale(
    roundToNDecimals(Number(exchangeRate), 8)
  );
  return `1 ${
    isFarmDeposit ? vault.depositERC20Symbol : vault.redeemERC20Symbol
  } = ${exchangeRateText} ${
    isFarmDeposit ? vault.redeemERC20Symbol : vault.depositERC20Symbol
  }`;
};

export const getFarmActionTitle = (
  networkName: NetworkName,
  cookbookFarmRecipeType: Optional<CookbookFarmRecipeType>,
  availableWallets: Optional<AvailableWallet[]>,
  vault: Optional<Vault>,
  erc20: Optional<ERC20Token>
) => {
  const isFarmDeposit =
    cookbookFarmRecipeType === CookbookFarmRecipeType.Deposit;
  const vaultDisplayName = vault ? getVaultDisplayName(vault.type) : undefined;
  const title = isFarmDeposit
    ? `${vaultDisplayName ?? "Farm"} deposit`
    : `${vaultDisplayName ?? "Farm"} redeem`;

  return erc20
    ? `${title}: ${getTokenDisplayName(erc20, availableWallets, networkName)}`
    : title;
};

export const getVaultMoreInfoLink = (vault: Vault) => {
  if (!isDefined(vault.id)) {
    return "Unknown URL";
  }
  switch (vault.type) {
    case VaultType.Beefy:
      return `https://app.beefy.finance/vault/${vault.id}`;
  }
};

export const getVaultsAndAssetsUrls = (): {
  vaultDisplayName: string;
  assetsUrl: string;
}[] => {
  return Object.values(VaultType).map((vaultType: VaultType) => {
    return {
      vaultDisplayName: getVaultAssetsButtonDisplayName(vaultType),
      assetsUrl: getVaultAssetsUrl(vaultType),
    };
  });
};

export const getTokenIconKeyForVaultType = (vaultType: VaultType) => {
  switch (vaultType) {
    case VaultType.Beefy:
      return TokenIconKey.ImageRecipeTokenBeefyKey;
  }
};

const beefyVaultToFrontendVault = (beefyVault: BeefyVaultData): Vault => {
  return {
    name: beefyVault.vaultName,
    id: beefyVault.vaultID,
    type: VaultType.Beefy,
    depositERC20Symbol: beefyVault.depositERC20Symbol,
    depositERC20Address: beefyVault.depositERC20Address,
    depositERC20Decimals: Number(beefyVault.depositERC20Decimals),
    redeemERC20Symbol: beefyVault.vaultERC20Symbol,
    redeemERC20Address: beefyVault.vaultERC20Address,
    redeemERC20Decimals: 18,
    apy: beefyVault.apy,
    vaultRate: beefyVault.vaultRate.toString(),
  };
};

export const fetchVaultInfo = async (
  vault: Vault,
  networkName: NetworkName
): Promise<Vault> => {
  let updatedVault: Vault;

  switch (vault.type) {
    case VaultType.Beefy:
      if (!isDefined(vault.id)) {
        throw new Error("No ID for Beefy vault.");
      }

      // eslint-disable-next-line no-case-declarations
      const beefyVault = await BeefyAPI.getBeefyVaultForID(
        vault.id,
        networkName
      );
      updatedVault = beefyVaultToFrontendVault(beefyVault);
  }

  return updatedVault;
};

export const fetchBeefyVaults = async (
  networkName: NetworkName,
  skipCache: boolean
): Promise<Vault[]> => {
  const beefyVaultData = await BeefyAPI.getFilteredBeefyVaults(
    networkName,
    skipCache,
    false
  );
  return beefyVaultData.map(beefyVaultToFrontendVault);
};

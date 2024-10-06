import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import { useEffect, useState } from "react";
import { CalloutType } from "../../models/callout";
import { AvailableWallet } from "../../models/wallet";
import { AppSettingsService } from "../../services/settings/app-settings-service";
import {
  getERC20TokensForNetwork,
  getTotalBalanceCurrency,
  tokenBalancesForWalletAndState,
} from "../../services/wallet/wallet-balance-service";
import { useReduxSelector } from "../hooks-redux";

export const useWalletCallout = (
  balanceBucketFilter: RailgunWalletBalanceBucket[]
) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { networkPrices } = useReduxSelector("networkPrices");
  const { erc20BalancesRailgun } = useReduxSelector("erc20BalancesRailgun");
  const { erc20BalancesNetwork } = useReduxSelector("erc20BalancesNetwork");

  const [text, setText] = useState<Optional<string>>();
  const [calloutType, setCalloutType] = useState<Optional<CalloutType>>();

  const tokens = getERC20TokensForNetwork(wallets.active, network.current.name);
  const walletBalancesNetwork =
    erc20BalancesNetwork.forNetwork[network.current.name];
  const walletBalancesRail =
    erc20BalancesRailgun.forNetwork[network.current.name];
  const tokenPrices =
    networkPrices.forNetwork[network.current.name]?.forCurrency[
      AppSettingsService.currency.code
    ];
  const { txidVersion } = useReduxSelector("txidVersion");
  const currentTxidVersion = txidVersion.current;

  useEffect(() => {
    if (wallets.active?.isViewOnlyWallet ?? false) {
      setText(
        "View-only: You can view the entire private history for this wallet. Transfers and other transactions are restricted."
      );
      setCalloutType(CalloutType.Info);
      return;
    }

    const tokenBalancesRail = tokenBalancesForWalletAndState(
      wallets.active,
      walletBalancesNetwork,
      walletBalancesRail,
      true,
      currentTxidVersion,
      balanceBucketFilter
    );
    const tokenBalancesNetwork = tokenBalancesForWalletAndState(
      wallets.active,
      walletBalancesNetwork,
      walletBalancesRail,
      false,
      currentTxidVersion,
      balanceBucketFilter
    );
    if (
      !isDefined(tokenBalancesRail) ||
      !isDefined(tokenPrices) ||
      !isDefined(tokenBalancesNetwork)
    ) {
      setText("");
      return;
    }
    const totalBalanceNetwork = getTotalBalanceCurrency(
      tokens,
      tokenBalancesNetwork,
      tokenPrices
    );
    const totalBalanceRail = getTotalBalanceCurrency(
      tokens,
      tokenBalancesRail,
      tokenPrices
    );
    const messageAndCallout = getWalletTodoMessageAndCalloutType(
      wallets.available,
      network.current.publicName,
      totalBalanceNetwork,
      totalBalanceRail
    );
    setText(messageAndCallout?.message);
    setCalloutType(messageAndCallout?.calloutType);
  }, [
    tokens,
    walletBalancesNetwork,
    walletBalancesRail,
    tokenPrices,
    wallets,
    network,
    currentTxidVersion,
    balanceBucketFilter,
  ]);

  const getWalletTodoMessageAndCalloutType = (
    allAvailableWallets: AvailableWallet[],
    networkPublicName: string,
    totalBalanceNetwork: number,
    totalBalanceRail: number
  ): Optional<{ calloutType: CalloutType; message: string }> => {
    if (!allAvailableWallets.length) {
      return {
        message:
          "Create or import a wallet to view your balances and shield your assets.",
        calloutType: CalloutType.Create,
      };
    }
    if (totalBalanceRail === 0 && totalBalanceNetwork === 0) {
      return {
        message: `Send assets to your ${networkPublicName} wallet to unlock shielding through RAILGUN.`,
        calloutType: CalloutType.Unlock,
      };
    }
    if (totalBalanceRail === 0 && totalBalanceNetwork > 0) {
      return {
        message: `Shield your ${networkPublicName} assets to use the growing selection of dApps, entirely privately.`,
        calloutType: CalloutType.Secure,
      };
    }
    return undefined;
  };

  return { calloutType, text };
};

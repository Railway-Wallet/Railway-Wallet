import { RailgunWalletBalanceBucket } from "@railgun-community/shared-models";
import { useEffect, useState } from "react";
import { findAllBroadcastersForChain } from "../../bridge";
import { DEFAULT_WALLET_TOKENS_FOR_NETWORK } from "../../models/default-tokens";
import { ERC20Amount, ERC20Token } from "../../models/token";
import { AppSettingsService } from "../../services";
import { getTopTokenForWallet } from "../../services/wallet/wallet-balance-service";
import { useReduxSelector } from "../hooks-redux";

export const useBroadcasterFeeERC20 = (
  tokenAmounts: ERC20Amount[],
  useRelayAdapt: boolean
) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { networkPrices } = useReduxSelector("networkPrices");
  const { erc20BalancesRailgun } = useReduxSelector("erc20BalancesRailgun");
  const { txidVersion } = useReduxSelector("txidVersion");

  useEffect(() => {
    const setInitialFeeToken = async () => {
      const broadcasters = await findAllBroadcastersForChain(
        network.current.chain,
        useRelayAdapt
      );

      const feeTokenAddresses =
        broadcasters?.map((broadcaster) => broadcaster.tokenAddress) ?? [];
      const addedTokens = wallets.active?.addedTokens[network.current.name];
      const skippedTokens: ERC20Token[] = [];

      if (addedTokens) {
        addedTokens.forEach((addedToken) => {
          if (!feeTokenAddresses.includes(addedToken.address)) {
            skippedTokens.push(addedToken);
          }
        });
      }

      const railgunWalletBalances =
        erc20BalancesRailgun.forNetwork[network.current.name];
      const tokenPrices =
        networkPrices.forNetwork[network.current.name]?.forCurrency[
          AppSettingsService.currency.code
        ];
      const isRailgun = true;

      const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];

      const topToken = getTopTokenForWallet(
        wallets.active,
        network.current.name,
        undefined,
        railgunWalletBalances,
        tokenPrices,
        skippedTokens,
        isRailgun,
        txidVersion.current,
        balanceBucketFilter
      );
      const firstSelectedToken = () =>
        tokenAmounts.length ? tokenAmounts[0].token : undefined;

      const firstAddedToken = () => {
        return addedTokens && addedTokens.length ? addedTokens[0] : undefined;
      };

      setSelectedFeeToken(
        topToken ??
          firstSelectedToken() ??
          firstAddedToken() ??
          DEFAULT_WALLET_TOKENS_FOR_NETWORK[network.current.name][0]
      );
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    setInitialFeeToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network.current.name, useRelayAdapt]);

  const [selectedFeeToken, setSelectedFeeToken] = useState<ERC20Token>(
    DEFAULT_WALLET_TOKENS_FOR_NETWORK[network.current.name][0]
  );
  const [showBroadcasterFeeERC20Modal, setShowBroadcasterFeeERC20Modal] =
    useState(false);

  const selectBroadcasterFeeERC20Modal = () => {
    setShowBroadcasterFeeERC20Modal(true);
  };

  const onDismissSelectBroadcasterFee = (token?: ERC20Token) => {
    if (token) {
      setSelectedFeeToken(token);
    }
    setShowBroadcasterFeeERC20Modal(false);
  };

  return {
    selectedFeeToken,
    selectBroadcasterFeeERC20Modal,
    showBroadcasterFeeERC20Modal,
    onDismissSelectBroadcasterFee,
  };
};

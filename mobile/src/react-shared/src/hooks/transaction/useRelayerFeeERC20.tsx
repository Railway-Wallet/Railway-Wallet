import { RailgunWalletBalanceBucket } from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';
import { findAllRelayersForChain } from '../../bridge';
import { DEFAULT_WALLET_TOKENS_FOR_NETWORK } from '../../models/default-tokens';
import { ERC20Amount, ERC20Token } from '../../models/token';
import { AppSettingsService } from '../../services';
import { getTopTokenForWallet } from '../../services/wallet/wallet-balance-service';
import { useReduxSelector } from '../hooks-redux';

export const useRelayerFeeERC20 = (
  tokenAmounts: ERC20Amount[],
  useRelayAdapt: boolean,
) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { networkPrices } = useReduxSelector('networkPrices');
  const { erc20BalancesRailgun } = useReduxSelector('erc20BalancesRailgun');
  const { txidVersion } = useReduxSelector('txidVersion');

  useEffect(() => {
    const setInitialFeeToken = async () => {
      const relayers = await findAllRelayersForChain(
        network.current.chain,
        useRelayAdapt,
      );

      const feeTokenAddresses =
        relayers?.map(relayer => relayer.tokenAddress) ?? [];
      const addedTokens = wallets.active?.addedTokens[network.current.name];
      const skippedTokens: ERC20Token[] = [];

      if (addedTokens) {
        addedTokens.forEach(addedToken => {
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
        undefined, railgunWalletBalances,
        tokenPrices,
        skippedTokens,
        isRailgun,
        txidVersion.current,
        balanceBucketFilter,
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
          DEFAULT_WALLET_TOKENS_FOR_NETWORK[network.current.name][0],
      );
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    setInitialFeeToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network.current.name, useRelayAdapt]);

  const [selectedFeeToken, setSelectedFeeToken] = useState<ERC20Token>(
    DEFAULT_WALLET_TOKENS_FOR_NETWORK[network.current.name][0],
  );
  const [showRelayerFeeERC20Modal, setShowRelayerFeeERC20Modal] =
    useState(false);

  const selectRelayerFeeERC20Modal = () => {
    setShowRelayerFeeERC20Modal(true);
  };

  const onDismissSelectRelayerFee = (token?: ERC20Token) => {
    if (token) {
      setSelectedFeeToken(token);
    }
    setShowRelayerFeeERC20Modal(false);
  };

  return {
    selectedFeeToken,
    selectRelayerFeeERC20Modal,
    showRelayerFeeERC20Modal,
    onDismissSelectRelayerFee,
  };
};

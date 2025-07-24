import {
  calculateTotalGas,
  isDefined,
  RailgunWalletBalanceBucket,
  TransactionGasDetails,
} from '@railgun-community/shared-models';
import { useMemo } from 'react';
import { BASE_TOKEN_ADDRESS, ERC20Token } from '../../models/token';
import { useERC20BalancesSerialized } from '../balances';
import { useReduxSelector } from '../hooks-redux';

export const useGasTokenBalanceError = (
  selectedBroadcasterFeeToken: Optional<ERC20Token>,
  sendWithPublicWallet: boolean,
  balanceBucketFilter: RailgunWalletBalanceBucket[],
  gasDetails?: TransactionGasDetails,
) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { erc20BalancesNetwork } = useReduxSelector('erc20BalancesNetwork');

  const currentWallet = wallets.active;
  const networkBalances = erc20BalancesNetwork.forNetwork[network.current.name];

  const { tokenBalancesSerialized: railgunTokenBalancesSerialized } =
    useERC20BalancesSerialized(
      true, balanceBucketFilter,
    );

  const currentBaseTokenBalanceString =
    isDefined(currentWallet) &&
    isDefined(networkBalances) &&
    isDefined(networkBalances.forWallet[currentWallet.id])
      ? networkBalances.forWallet[currentWallet.id]?.[BASE_TOKEN_ADDRESS]
      : undefined;

  const gasTokenBalanceError = useMemo((): Optional<Error> => {
    if (!gasDetails) {
      return undefined;
    }

    const totalGas = calculateTotalGas(gasDetails);

    if (!sendWithPublicWallet && isDefined(selectedBroadcasterFeeToken)) {
      const balance =
        railgunTokenBalancesSerialized[
          selectedBroadcasterFeeToken.address.toLowerCase()
        ];
      const hasSymbol = 'symbol' in selectedBroadcasterFeeToken;

      if (isDefined(balance) && hasSymbol) {
        const balanceBigInt = BigInt(balance);

        if (totalGas > balanceBigInt) {
          return new Error(
            `You do not have enough ${selectedBroadcasterFeeToken.symbol} for this transaction.`,
          );
        }
      } else {
        return new Error(
          `No balance found for ${selectedBroadcasterFeeToken.address}.`,
        );
      }
    }

    if (!isDefined(currentBaseTokenBalanceString) ||
    currentBaseTokenBalanceString === '') {
      return new Error(
        `No balance found for ${network.current.baseToken.symbol}.`,
      );
    }

    const currentBaseTokenBalance = BigInt(currentBaseTokenBalanceString);

    if (totalGas > currentBaseTokenBalance) {
      return new Error(
        `You do not have enough ${network.current.baseToken.symbol} for this transaction.`,
      );
    }

    return undefined;
  }, [
    gasDetails,
    sendWithPublicWallet,
    currentBaseTokenBalanceString,
    railgunTokenBalancesSerialized,
    selectedBroadcasterFeeToken,
    network,
  ]);

  return {
    gasTokenBalanceError,
  };
};

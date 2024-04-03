import {
  isDefined,
  RelayerConnectionStatus,
  SelectedRelayer,
  TransactionGasDetails,
} from '@railgun-community/shared-models';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GasDetailsBySpeed } from '../../models';
import { RelayerFeeInfo } from '../../models/relayer';
import { ERC20Token } from '../../models/token';
import { getTokenDisplayName } from '../../utils/tokens';
import { relayerFeeInfoText } from '../../utils/transactions';
import { useReduxSelector } from '../hooks-redux';
import { useRelayerConnectionStatus } from '../networking/useRelayerConnectionStatus';

export const useRelayerFee = (
  selectedFeeToken: ERC20Token,
  selectedRelayer: Optional<SelectedRelayer>,
  selectedRelayerLocked: boolean,
  selectedGasDetails: Optional<TransactionGasDetails>,
  gasDetailsBySpeed: Optional<GasDetailsBySpeed>,
  gasEstimateError: Optional<Error>,
): RelayerFeeInfo => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { networkPrices } = useReduxSelector('networkPrices');

  const { relayerConnectionStatus } = useRelayerConnectionStatus();

  const defaultEstimatingInfo = useMemo(() => {
    const tokenDisplayName = getTokenDisplayName(
      selectedFeeToken,
      wallets.available,
      network.current.name,
    );
    const relayerFeeText = gasDetailsBySpeed
      ? `Paid in ${tokenDisplayName}`
      : 'Getting current gas prices...';
    return {
      relayerFeeText,
      relayerFeeSubtext: 'Please wait',
      relayerFeeERC20Amount: undefined,
      relayerFeeIsEstimating: isDefined(gasDetailsBySpeed),
    };
  }, [selectedFeeToken, wallets.available, network, gasDetailsBySpeed]);

  const [relayerFeeInfo, setRelayerFeeInfo] = useState<RelayerFeeInfo>(
    defaultEstimatingInfo,
  );

  const tokenDisplayName = useMemo(() => {
    return getTokenDisplayName(
      selectedFeeToken,
      wallets.available,
      network.current.name,
    );
  }, [network, selectedFeeToken, wallets.available]);

  const selectedRelayerFee = useCallback(
    (
      selectedRelayer: SelectedRelayer,
      gasDetails: TransactionGasDetails,
    ): Optional<RelayerFeeInfo> => {
      const showExactCurrencyGasPrice = false;

      return relayerFeeInfoText(
        wallets.available,
        network.current,
        networkPrices,
        selectedRelayer,
        selectedFeeToken,
        gasDetails,
        showExactCurrencyGasPrice,
      );
    },
    [network, networkPrices, selectedFeeToken, wallets.available],
  );

  const noRelayerFeeInfo: () => RelayerFeeInfo = useCallback(() => {
    if (relayerConnectionStatus === RelayerConnectionStatus.Searching) {
      return {
        relayerFeeText: `Searching for public relayers...`,
        relayerFeeSubtext: 'None found. Please wait.',
        relayerFeeERC20Amount: undefined,
        relayerFeeIsEstimating: false,
      };
    }
    if (relayerConnectionStatus === RelayerConnectionStatus.Disconnected) {
      return {
        relayerFeeText: 'Public relayer network connection was broken',
        relayerFeeSubtext: 'Attempting to re-establish',
        relayerFeeERC20Amount: undefined,
        relayerFeeIsEstimating: false,
      };
    }
    if (relayerConnectionStatus === RelayerConnectionStatus.AllUnavailable) {
      return {
        relayerFeeText: `All ${network.current.shortPublicName} public relayers are busy`,
        relayerFeeSubtext: 'Please try again later',
        relayerFeeERC20Amount: undefined,
        relayerFeeIsEstimating: false,
      };
    }
    return {
      relayerFeeText: `Finding public relayer that accepts ${tokenDisplayName}`,
      relayerFeeSubtext: 'Please wait or select fee token',
      relayerFeeERC20Amount: undefined,
      relayerFeeIsEstimating: false,
    };
  }, [network, relayerConnectionStatus, tokenDisplayName]);

  const updatedRelayerFeeInfo = useCallback((): Optional<RelayerFeeInfo> => {
    if (selectedRelayerLocked) {
      return;
    }
    if (isDefined(gasEstimateError)) {
      return {
        relayerFeeText: 'Error',
        relayerFeeSubtext: `Gas estimation error with ${tokenDisplayName} fee`,
        relayerFeeERC20Amount: undefined,
        relayerFeeIsEstimating: false,
      };
    }
    if (!selectedRelayer) {
      return noRelayerFeeInfo();
    }
    if (!selectedGasDetails) {
      return defaultEstimatingInfo;
    }
    return selectedRelayerFee(selectedRelayer, selectedGasDetails);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedRelayerLocked,
    gasEstimateError,
    selectedGasDetails,
    selectedRelayer,
    selectedRelayerFee,
    tokenDisplayName,
    defaultEstimatingInfo,
    noRelayerFeeInfo,
  ]);

  useEffect(() => {
    const info = updatedRelayerFeeInfo();
    if (info) {
      setRelayerFeeInfo(info);
    }
  }, [updatedRelayerFeeInfo]);

  return relayerFeeInfo;
};

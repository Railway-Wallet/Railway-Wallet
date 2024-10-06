import {
  BroadcasterConnectionStatus,
  isDefined,
  SelectedBroadcaster,
  TransactionGasDetails,
} from "@railgun-community/shared-models";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GasDetailsBySpeed } from "../../models";
import { BroadcasterFeeInfo } from "../../models/broadcaster";
import { ERC20Token } from "../../models/token";
import { getTokenDisplayName } from "../../utils/tokens";
import { broadcasterFeeInfoText } from "../../utils/transactions";
import { useReduxSelector } from "../hooks-redux";
import { useBroadcasterConnectionStatus } from "../networking/useBroadcasterConnectionStatus";

export const useBroadcasterFee = (
  selectedFeeToken: ERC20Token,
  selectedBroadcaster: Optional<SelectedBroadcaster>,
  selectedBroadcasterLocked: boolean,
  selectedGasDetails: Optional<TransactionGasDetails>,
  gasDetailsBySpeed: Optional<GasDetailsBySpeed>,
  gasEstimateError: Optional<Error>
): BroadcasterFeeInfo => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { networkPrices } = useReduxSelector("networkPrices");

  const { broadcasterConnectionStatus } = useBroadcasterConnectionStatus();

  const defaultEstimatingInfo = useMemo(() => {
    const tokenDisplayName = getTokenDisplayName(
      selectedFeeToken,
      wallets.available,
      network.current.name
    );
    const broadcasterFeeText = gasDetailsBySpeed
      ? `Paid in ${tokenDisplayName}`
      : "Getting current gas prices...";
    return {
      broadcasterFeeText,
      broadcasterFeeSubtext: "Please wait",
      broadcasterFeeERC20Amount: undefined,
      broadcasterFeeIsEstimating: isDefined(gasDetailsBySpeed),
    };
  }, [selectedFeeToken, wallets.available, network, gasDetailsBySpeed]);

  const [broadcasterFeeInfo, setBroadcasterFeeInfo] =
    useState<BroadcasterFeeInfo>(defaultEstimatingInfo);

  const tokenDisplayName = useMemo(() => {
    return getTokenDisplayName(
      selectedFeeToken,
      wallets.available,
      network.current.name
    );
  }, [network, selectedFeeToken, wallets.available]);

  const selectedBroadcasterFee = useCallback(
    (
      selectedBroadcaster: SelectedBroadcaster,
      gasDetails: TransactionGasDetails
    ): Optional<BroadcasterFeeInfo> => {
      const showExactCurrencyGasPrice = false;

      return broadcasterFeeInfoText(
        wallets.available,
        network.current,
        networkPrices,
        selectedBroadcaster,
        selectedFeeToken,
        gasDetails,
        showExactCurrencyGasPrice
      );
    },
    [network, networkPrices, selectedFeeToken, wallets.available]
  );

  const noBroadcasterFeeInfo: () => BroadcasterFeeInfo = useCallback(() => {
    if (broadcasterConnectionStatus === BroadcasterConnectionStatus.Searching) {
      return {
        broadcasterFeeText: `Searching for public broadcasters...`,
        broadcasterFeeSubtext: "None found. Please wait.",
        broadcasterFeeERC20Amount: undefined,
        broadcasterFeeIsEstimating: false,
      };
    }
    if (
      broadcasterConnectionStatus === BroadcasterConnectionStatus.Disconnected
    ) {
      return {
        broadcasterFeeText: "Public broadcaster network connection was broken",
        broadcasterFeeSubtext: "Attempting to re-establish",
        broadcasterFeeERC20Amount: undefined,
        broadcasterFeeIsEstimating: false,
      };
    }
    if (
      broadcasterConnectionStatus === BroadcasterConnectionStatus.AllUnavailable
    ) {
      return {
        broadcasterFeeText: `All ${network.current.shortPublicName} public broadcasters are busy`,
        broadcasterFeeSubtext: "Please try again later",
        broadcasterFeeERC20Amount: undefined,
        broadcasterFeeIsEstimating: false,
      };
    }
    return {
      broadcasterFeeText: `Finding public broadcaster that accepts ${tokenDisplayName}`,
      broadcasterFeeSubtext: "Please wait or select fee token",
      broadcasterFeeERC20Amount: undefined,
      broadcasterFeeIsEstimating: false,
    };
  }, [network, broadcasterConnectionStatus, tokenDisplayName]);

  const updatedBroadcasterFeeInfo =
    useCallback((): Optional<BroadcasterFeeInfo> => {
      if (selectedBroadcasterLocked) {
        return;
      }
      if (isDefined(gasEstimateError)) {
        return {
          broadcasterFeeText: "Error",
          broadcasterFeeSubtext: `Gas estimation error with ${tokenDisplayName} fee`,
          broadcasterFeeERC20Amount: undefined,
          broadcasterFeeIsEstimating: false,
        };
      }
      if (!selectedBroadcaster) {
        return noBroadcasterFeeInfo();
      }
      if (!selectedGasDetails) {
        return defaultEstimatingInfo;
      }
      return selectedBroadcasterFee(selectedBroadcaster, selectedGasDetails);
    }, [
      selectedBroadcasterLocked,
      gasEstimateError,
      selectedGasDetails,
      selectedBroadcaster,
      selectedBroadcasterFee,
      tokenDisplayName,
      defaultEstimatingInfo,
      noBroadcasterFeeInfo,
    ]);

  useEffect(() => {
    const info = updatedBroadcasterFeeInfo();
    if (isDefined(info)) {
      setBroadcasterFeeInfo(info);
    }
  }, [updatedBroadcasterFeeInfo]);

  return broadcasterFeeInfo;
};

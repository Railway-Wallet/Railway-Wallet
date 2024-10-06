import { TXIDVersion } from "@railgun-community/shared-models";
import { useMemo } from "react";
import { useReduxSelector } from "../hooks-redux";

export const useRailgunShieldSpenderContract = () => {
  const { network } = useReduxSelector("network");
  const { txidVersion } = useReduxSelector("txidVersion");

  const shieldApproveSpender = useMemo(() => {
    switch (txidVersion.current) {
      case TXIDVersion.V2_PoseidonMerkle:
        return network.current.proxyContract;
      case TXIDVersion.V3_PoseidonMerkle:
        return network.current.tokenVaultV3Contract;
    }
  }, [network, txidVersion]);

  const shieldApproveSpenderName = useMemo(() => {
    switch (txidVersion.current) {
      case TXIDVersion.V2_PoseidonMerkle:
        return "RailgunSmartWallet Proxy (V2)";
      case TXIDVersion.V3_PoseidonMerkle:
        return "RAILGUN TokenVault (V3)";
    }
  }, [txidVersion]);

  return { shieldApproveSpender, shieldApproveSpenderName };
};

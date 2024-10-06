import {
  isDefined,
  NetworkName,
  OFAC_SANCTIONS_LIST_ADDRESSES,
} from "@railgun-community/shared-models";
import axios from "axios";
import { Contract } from "ethers";
import { store } from "../redux-store/store";
import { ProviderService } from "../services";
import ABIChainalysisOfacOracle from "./abi/ChainalysisOfacOracle.json";
import { throwErrorCode } from "./error-code";
import { logDev, logDevError } from "./logging";
import { networkForName } from "./networks";

export const hasBlockedAddress = async (
  addresses: Optional<string>[]
): Promise<boolean> => {
  return (
    await Promise.all(addresses.map((address) => isBlockedAddress(address)))
  ).some((isBlocked) => isBlocked);
};

export const assertHasNoHighSevereRiskAddress = async (
  networkName: NetworkName,
  addresses: string[]
): Promise<void> => {
  for (const address of addresses) {
    await assertIsNotHighSevereRiskAddress(networkName, address);
  }
};

export const isBlockedAddress = async (address?: string): Promise<boolean> => {
  if (!isDefined(address)) {
    return false;
  }
  if (OFAC_SANCTIONS_LIST_ADDRESSES.includes(address.toLowerCase())) {
    return true;
  }
  if (await isSanctionedAddress(address)) {
    return true;
  }
  return false;
};

export const isSanctionedAddress = async (
  address: string
): Promise<boolean> => {
  const { remoteConfig } = store.getState();
  if (!remoteConfig.current || !remoteConfig.current.proxyApiUrl) {
    throw new Error("No remote config for address screening.");
  }

  try {
    const url = `${remoteConfig.current.proxyApiUrl}/address/screen/${address}`;
    const { data } = await axios.get(url);

    const identifications = data.identifications as {
      category: string;
      source: string;
    }[];

    const isSanctioned =
      isDefined(identifications) &&
      identifications.some(
        (id) =>
          id.category.toLowerCase() === "sanctions" ||
          id.category.toLowerCase() === "sanctioned entity"
      );

    return isSanctioned;
  } catch (err) {
    logDevError(err);
    if (!(err instanceof Error)) {
      throw err;
    }

    const isSanctionedByOracle = await isSanctionedAddressByOracle(address);
    if (isDefined(isSanctionedByOracle)) {
      return isSanctionedByOracle;
    }

    throw new Error(
      `Could not connect - code 66000. Please try again in a few moments.`
    );
  }
};

const isSanctionedAddressByOracle = async (
  address: string
): Promise<Optional<boolean>> => {
  try {
    const networkName = NetworkName.Ethereum;
    const oracleAddress = "0x40C57923924B5c5c5455c48D93317139ADDaC8fb";

    const provider = await ProviderService.getProvider(networkName);
    const oracleContract = new Contract(
      oracleAddress,
      ABIChainalysisOfacOracle,
      provider
    );

    const isSanctioned: boolean = await oracleContract.isSanctioned(address);
    return isSanctioned;
  } catch (err) {
    logDev("Could not connect to ethereum oracle");
    logDevError(err);
    return undefined;
  }
};

const registerForWalletScreen = async (
  proxyApiUrl: string,
  address: string
) => {
  try {
    const registerAddressURL = `${proxyApiUrl}/address/risk/entities`;
    await axios.post(registerAddressURL, { address });
  } catch (err) {
    logDevError(err);
    throw new Error(
      `Could not connect - code 66001. Please try again in a few moments.`
    );
  }
};

const getRiskAssessment = async (
  proxyApiUrl: string,
  address: string
): Promise<{
  risk: string;
  riskReason: string;
}> => {
  try {
    const screenAddressURL = `${proxyApiUrl}/address/risk/entities/${address}`;
    const { data } = await axios.get(screenAddressURL);
    return data;
  } catch (err) {
    logDevError(err);
    throw new Error(
      `Could not connect - code 66002. Please try again in a few moments.`
    );
  }
};

export const assertIsNotHighSevereRiskAddress = async (
  networkName: NetworkName,
  address: string
): Promise<void> => {
  const network = networkForName(networkName);
  if (network?.isTestnet === true) {
    return;
  }

  const { remoteConfig } = store.getState();
  if (!remoteConfig.current || !remoteConfig.current.proxyApiUrl) {
    throw new Error("No remote config for address screening.");
  }

  await registerForWalletScreen(remoteConfig.current.proxyApiUrl, address);

  const riskAssessment = await getRiskAssessment(
    remoteConfig.current.proxyApiUrl,
    address
  );

  if (riskAssessment.risk === "High") {
    throwErrorCode("66");
  }
  if (riskAssessment.risk === "Severe") {
    throwErrorCode("67");
  }
};

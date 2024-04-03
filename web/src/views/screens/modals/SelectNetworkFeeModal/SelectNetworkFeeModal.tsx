import {
  EVMGasType,
  isDefined,
  SelectedRelayer,
  TransactionGasDetails,
} from '@railgun-community/shared-models';
import React, { useState } from 'react';
import { Button } from '@components/Button/Button';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import {
  CustomGasTransactionDetails,
  ERC20Token,
  logDev,
  NetworkFeeSelection,
  networkGasText,
  relayerFeeInfoText,
  useReduxSelector,
} from '@react-shared';
import { CustomNetworkFeeType2Modal } from '@screens/modals/CustomNetworkFeeModal/CustomNetworkFeeType2Modal';
import { CustomNetworkFeeTypes01Modal } from '@screens/modals/CustomNetworkFeeModal/CustomNetworkFeeTypes01Modal';
import { NetworkFeeOption } from './NetworkFeeOption/NetworkFeeOption';
import styles from './SelectNetworkFeeModal.module.scss';

type Props = {
  onDismiss: (
    networkFeeSelection?: NetworkFeeSelection,
    customGasTransactionDetails?: CustomGasTransactionDetails,
  ) => void;
  currentOption: NetworkFeeSelection;
  gasDetailsMap: Record<NetworkFeeSelection, TransactionGasDetails>;
  defaultCustomGasTransactionDetails: CustomGasTransactionDetails;
  selectedRelayer: Optional<SelectedRelayer>;
  selectedFeeToken: ERC20Token;
  isRelayerTransaction: boolean;
};

export const SelectNetworkFeeModal: React.FC<Props> = ({
  onDismiss,
  currentOption,
  gasDetailsMap,
  defaultCustomGasTransactionDetails,
  selectedRelayer,
  selectedFeeToken,
  isRelayerTransaction,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { networkPrices } = useReduxSelector('networkPrices');

  const [selectedOption, setSelectedOption] = useState(currentOption);

  const [customGasPrice, setCustomGasPrice] = useState<Optional<bigint>>(
    defaultCustomGasTransactionDetails.gasPrice,
  );
  const [customMaxFeePerGas, setCustomMaxFeePerGas] = useState<
    Optional<bigint>
  >(defaultCustomGasTransactionDetails.maxFeePerGas);
  const [customMaxPriorityFeePerGas, setCustomMaxPriorityFeePerGas] = useState<
    Optional<bigint>
  >(defaultCustomGasTransactionDetails.maxPriorityFeePerGas);
  const [showCustomNetworkFeeModal, setShowCustomNetworkFeeModal] =
    useState(false);

  const onSelectNetworkFeeOption = (option: NetworkFeeSelection) => {
    setSelectedOption(option);
  };

  const networkFeeOptionRightView = (gasDetails: TransactionGasDetails) => {
    if (!isDefined(gasDetails)) {
      return null;
    }

    const showExactCurrencyGasPrice = true;

    let gasTextFormatted: {
      networkFeeText: string;
      networkFeePriceText: string;
    };

    if (isRelayerTransaction) {
      if (!selectedRelayer) {
        logDev(
          'Requires selected relayer and fee token to choose network fee.',
        );
        return null;
      }
      const relayerFeeInfo = relayerFeeInfoText(
        wallets.available,
        network.current,
        networkPrices,
        selectedRelayer,
        selectedFeeToken,
        gasDetails,
        showExactCurrencyGasPrice,
      );
      gasTextFormatted = {
        networkFeeText: relayerFeeInfo?.relayerFeeText ?? 'Updating gas fee',
        networkFeePriceText:
          relayerFeeInfo?.relayerFeeSubtext ?? 'Please wait...',
      };
    } else {
      gasTextFormatted = networkGasText(
        network.current,
        networkPrices,
        gasDetails,
        showExactCurrencyGasPrice,
      );
    }

    return (
      <div className={styles.rightText}>
        <Text className={styles.rightTitle}>
          {gasTextFormatted.networkFeeText}
        </Text>
        <Text className={styles.rightDescription}>
          {gasTextFormatted.networkFeePriceText}
        </Text>
      </div>
    );
  };

  const customGasDetailsTypes01 = (
    evmGasType: EVMGasType.Type0 | EVMGasType.Type1,
    gasPrice: bigint,
  ): TransactionGasDetails => {
    return {
      evmGasType,
      gasEstimate: gasDetailsMap[NetworkFeeSelection.Standard].gasEstimate,
      gasPrice,
    };
  };

  const customGasDetailsType2 = (
    maxFeePerGas: bigint,
    maxPriorityFeePerGas: bigint,
  ): TransactionGasDetails => {
    return {
      evmGasType: EVMGasType.Type2,
      gasEstimate: gasDetailsMap[NetworkFeeSelection.Standard].gasEstimate,
      maxFeePerGas,
      maxPriorityFeePerGas,
    };
  };

  const customNetworkFeeOptionRightView = () => {
    const normalGasDetails = gasDetailsMap[NetworkFeeSelection.Standard];
    switch (normalGasDetails.evmGasType) {
      case EVMGasType.Type0:
      case EVMGasType.Type1: {
        if (isDefined(customGasPrice)) {
          return networkFeeOptionRightView(
            customGasDetailsTypes01(
              normalGasDetails.evmGasType,
              customGasPrice,
            ),
          );
        }
        break;
      }
      case EVMGasType.Type2: {
        if (
          isDefined(customMaxFeePerGas) &&
          isDefined(customMaxPriorityFeePerGas)
        ) {
          return networkFeeOptionRightView(
            customGasDetailsType2(
              customMaxFeePerGas,
              customMaxPriorityFeePerGas,
            ),
          );
        }
        break;
      }
    }

    return rightView('Advanced gas selection', 'Set custom gas fee');
  };

  const rightView = (rightTitle: string, rightDescription: string) => {
    return (
      <div className={styles.rightText}>
        <Text className={styles.rightTitle}>{rightTitle}</Text>
        <Text className={styles.rightDescription}>{rightDescription}</Text>
      </div>
    );
  };

  const getDefaultGasDetailsForCustomFee = () => {
    const defaultGasDetails = gasDetailsMap[selectedOption];
    if (selectedOption === NetworkFeeSelection.Custom) {
      switch (defaultGasDetails.evmGasType) {
        case EVMGasType.Type0:
        case EVMGasType.Type1: {
          if (isDefined(customGasPrice)) {
            return customGasDetailsTypes01(
              defaultGasDetails.evmGasType,
              customGasPrice,
            );
          }
          break;
        }
        case EVMGasType.Type2: {
          if (
            isDefined(customMaxFeePerGas) &&
            isDefined(customMaxPriorityFeePerGas)
          ) {
            return customGasDetailsType2(
              customMaxFeePerGas,
              customMaxPriorityFeePerGas,
            );
          }
          break;
        }
      }
    }
    return defaultGasDetails;
  };

  const getCustomNetworkFeeModal = () => {
    const defaultGasDetails = getDefaultGasDetailsForCustomFee();
    switch (defaultGasDetails.evmGasType) {
      case EVMGasType.Type0:
      case EVMGasType.Type1:
        return (
          <CustomNetworkFeeTypes01Modal
            onDismiss={onDismissCustomFeeTypes01Modal}
            defaultGasDetails={defaultGasDetails}
          />
        );
      case EVMGasType.Type2:
        return (
          <CustomNetworkFeeType2Modal
            onDismiss={onDismissCustomFeeType2Modal}
            defaultGasDetails={defaultGasDetails}
          />
        );
    }
  };

  const onSelectCustomFee = () => {
    setShowCustomNetworkFeeModal(true);
  };

  const onDismissCustomFeeTypes01Modal = (customGasPrice?: bigint) => {
    if (isDefined(customGasPrice)) {
      setCustomGasPrice(customGasPrice);
      setSelectedOption(NetworkFeeSelection.Custom);
    }
    setShowCustomNetworkFeeModal(false);
  };

  const onDismissCustomFeeType2Modal = (
    customMaxFeePerGas?: bigint,
    customMaxPriorityFeePerGas?: bigint,
  ) => {
    if (
      isDefined(customMaxFeePerGas) &&
      isDefined(customMaxPriorityFeePerGas)
    ) {
      setCustomMaxFeePerGas(customMaxFeePerGas);
      setCustomMaxPriorityFeePerGas(customMaxPriorityFeePerGas);
      setSelectedOption(NetworkFeeSelection.Custom);
    }
    setShowCustomNetworkFeeModal(false);
  };

  return (
    <>
      {showCustomNetworkFeeModal && getCustomNetworkFeeModal()}
      <GenericModal onClose={onDismiss} title="Network fee">
        <div className={styles.wrapper}>
          <div className={styles.listWrapper}>
            <Text className={styles.listHeader}>Select transaction speed</Text>
            <NetworkFeeOption
              title="Slower"
              description=""
              selected={selectedOption === NetworkFeeSelection.Slower}
              onSelect={() =>
                onSelectNetworkFeeOption(NetworkFeeSelection.Slower)
              }
              rightView={() =>
                networkFeeOptionRightView(
                  gasDetailsMap[NetworkFeeSelection.Slower],
                )
              }
            />
            <NetworkFeeOption
              title="Standard"
              description=""
              selected={selectedOption === NetworkFeeSelection.Standard}
              onSelect={() =>
                onSelectNetworkFeeOption(NetworkFeeSelection.Standard)
              }
              rightView={() =>
                networkFeeOptionRightView(
                  gasDetailsMap[NetworkFeeSelection.Standard],
                )
              }
            />
            <NetworkFeeOption
              title="Faster"
              description=""
              selected={selectedOption === NetworkFeeSelection.Faster}
              onSelect={() =>
                onSelectNetworkFeeOption(NetworkFeeSelection.Faster)
              }
              rightView={() =>
                networkFeeOptionRightView(
                  gasDetailsMap[NetworkFeeSelection.Faster],
                )
              }
            />
            <NetworkFeeOption
              title="Aggressive"
              description=""
              selected={selectedOption === NetworkFeeSelection.Aggressive}
              onSelect={() =>
                onSelectNetworkFeeOption(NetworkFeeSelection.Aggressive)
              }
              rightView={() =>
                networkFeeOptionRightView(
                  gasDetailsMap[NetworkFeeSelection.Aggressive],
                )
              }
            />
            <NetworkFeeOption
              title="Custom"
              description=""
              selected={selectedOption === NetworkFeeSelection.Custom}
              onSelect={() => onSelectCustomFee()}
              rightView={() => customNetworkFeeOptionRightView()}
            />
          </div>
        </div>
        <Button
          onClick={() => {
            const customGasTransactionDetails: CustomGasTransactionDetails = {
              gasPrice: customGasPrice,
              maxFeePerGas: customMaxFeePerGas,
              maxPriorityFeePerGas: customMaxPriorityFeePerGas,
            };
            onDismiss(selectedOption, customGasTransactionDetails);
          }}
          children="Save"
          buttonClassName={styles.saveButton}
          textClassName={styles.saveButtonText}
        />
      </GenericModal>
    </>
  );
};

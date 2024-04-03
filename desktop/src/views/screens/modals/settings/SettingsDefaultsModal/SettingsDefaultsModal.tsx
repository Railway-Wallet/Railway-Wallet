import { useState } from 'react';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Selector } from '@components/Selector/Selector';
import { Text } from '@components/Text/Text';
import {
  AppSettingsService,
  currencyName,
  SUPPORTED_CURRENCIES,
} from '@react-shared';
import { createUpdateCurrencyAlert } from '@utils/alerts';
import {
  AlertProps,
  GenericAlert,
} from '@views/components/alerts/GenericAlert/GenericAlert';
import styles from './SettingsDefaultsModal.module.scss';
import application from '@scss/application.module.scss';

type Props = {
  onRequestClose: (option?: string) => void;
};

type CurrencyOption = {
  value: string;
  label: string;
};

export const SettingsDefaultsModal: React.FC<Props> = ({ onRequestClose }) => {
  const appCurrency = AppSettingsService.currency;
  const options: CurrencyOption[] = SUPPORTED_CURRENCIES.map(currency => {
    return {
      value: currency.code,
      label: currencyName(currency),
    };
  });
  const currentOption: CurrencyOption =
    options.find(currency => currency.value === appCurrency.code) ?? options[0];

  const [alert, setAlert] = useState<Optional<AlertProps>>();
  const [selectedOption, setSelectedOption] = useState(currentOption);

  const selectCurrency = async (option: CurrencyOption) => {
    const currency = SUPPORTED_CURRENCIES.find(
      currency => currency.code === option.value,
    );
    if (!currency) {
      return;
    }

    createUpdateCurrencyAlert(currency, setAlert, () => {
      setSelectedOption(option);
    });
  };

  return (
    <>
      <GenericModal onClose={onRequestClose} title="Default settings">
        <Text className={styles.headerText}>Currency</Text>
        <Selector
          options={options}
          value={selectedOption}
          placeholder="Select Currency"
          onValueChange={selectCurrency}
          menuPortalTarget={document.body}
          menuPortalStyle={{ zIndex: application.zIndexSubmenus }}
          containerClassName={styles.currencyContainer}
        />
      </GenericModal>
      {alert && <GenericAlert {...alert} />}
    </>
  );
};

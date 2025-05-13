import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import DatePicker from 'react-datepicker';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import { TextButton } from '@components/TextButton/TextButton';
import {
  AppSettingsService,
  CalloutType,
  FrontendWallet,
  SharedConstants,
  validateMnemonic,
  validateWalletName,
} from '@react-shared';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { ProcessNewWalletModal } from '@screens/modals/ProcessNewWalletModal/ProcessNewWalletModal';
import { IconType } from '@services/util/icon-service';
import { CreateWalletDisclaimerMessage } from '@views/components/CreateWalletDisclaimerMessage/CreateWalletDisclaimerMessage';
import { InfoCallout } from '@views/components/InfoCallout/InfoCallout';
import './datePickerStyles.scss';
import styles from './ImportWalletModal.module.scss';

interface ImportProps {
  onClose: (wallet?: FrontendWallet, authKey?: string) => void;
  onBack: () => void;
  showBackChevron?: boolean;
  afterPasswordAuthKey?: string;
}

export const ImportWalletModal = ({
  onClose,
  onBack,
  showBackChevron = true,
  afterPasswordAuthKey,
}: ImportProps) => {
  const [walletCreationDate, setWalletCreationDate] = useState<
    Date | undefined
  >();
  const [walletCreationTimestamp, setWalletCreationTimestamp] =
    useState<number>();
  const [walletName, setWalletName] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [derivationIndex, setDerivationIndex] = useState<string>('');
  const [hasValidWalletName, setHasValidWalletName] = useState(false);
  const [hasValidMnemonic, setHasValidMnemonic] = useState(false);
  const [hasValidDerivationIndex, setHasValidDerivationIndex] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [authKey, setAuthKey] =
    useState<Optional<string>>(afterPasswordAuthKey);

  if (!isDefined(authKey)) {
    return <EnterPasswordModal success={setAuthKey} onDismiss={onClose} />;
  }

  const onSubmit = () => {
    setShowProcessModal(true);
  };

  const updateWalletName = (e: React.BaseSyntheticEvent) => {
    const { value } = e.target;
    setWalletName(value);
    setHasValidWalletName(validateWalletName(value));
  };

  const updateMnemonic = (e: React.BaseSyntheticEvent) => {
    const { value } = e.target;
    setMnemonic(value);
    setHasValidMnemonic(validateMnemonic(value.trim()));
  };

  const updateDerivationIndex = (e: React.BaseSyntheticEvent) => {
    const { value } = e.target;
    setDerivationIndex(value);
    setHasValidDerivationIndex(!Number.isNaN(value));
  };

  const onSuccess = (wallet: FrontendWallet) => {
    setShowProcessModal(false);
    handleClose(wallet, authKey);
  };

  const onFail = () => {
    setShowProcessModal(false);
  };

  const onSelectDate = (date: Date) => {
    setWalletCreationDate(date);
    setWalletCreationTimestamp(date?.getTime() / 1000);
  };

  const handleClose = (wallet?: FrontendWallet, authKey?: string) => {
    onClose(wallet, authKey);
    setWalletCreationDate(undefined);
    setWalletCreationTimestamp(undefined);
  };

  const walletCreationDateIsSelected =
    isDefined(walletCreationTimestamp) && walletCreationTimestamp !== 0;

  return (
    (<GenericModal
      onClose={handleClose}
      onBack={onBack}
      title="Import Wallet"
      isBackChevron={showBackChevron}
      accessoryView={
        <Button
          buttonClassName={styles.actionButton}
          onClick={onSubmit}
          disabled={!hasValidWalletName || !hasValidMnemonic}
        >
          Submit
        </Button>
      }
    >
      <CreateWalletDisclaimerMessage className={styles.disclaimerText} />
      <div className={styles.inputContainer}>
        <Input
          testId="wallet-name-input"
          value={walletName}
          onChange={updateWalletName}
          placeholder="Wallet name"
          maxLength={SharedConstants.MAX_LENGTH_WALLET_NAME}
          hasError={walletName.length > 0 && !hasValidWalletName}
        />
      </div>
      <Input
        testId="wallet-seed-input"
        value={mnemonic}
        onChange={updateMnemonic}
        placeholder="Seed phrase"
        hasError={mnemonic.length > 0 && !hasValidMnemonic}
        endIcon={IconType.Shield}
        iconSize={18}
        iconClassName={styles.inputIcon}
        isTextArea
      />
      {!showAdvancedOptions && (
        <TextButton
          text={
            showAdvancedOptions
              ? 'Hide advanced options'
              : 'Show advanced options'
          }
          containerClassName={styles.advancedOptionsButton}
          action={() => setShowAdvancedOptions(!showAdvancedOptions)}
        />
      )}
      {showAdvancedOptions && (
        <div className={styles.advancedOptions}>
          <Input
            value={derivationIndex}
            onChange={updateDerivationIndex}
            placeholder="Derivation index (optional)"
            maxLength={3}
            hasError={derivationIndex.length > 0 && !hasValidDerivationIndex}
          />
          <Text className={styles.walletCreationDateLabel}>
            When was this wallet first created?
          </Text>
          {/* @ts-expect-error ignore this */}
          <DatePicker
            fixedHeight
            customInput={
              <Input
                iconSize={18}
                endIcon={IconType.EditCalendarIcon}
                iconClassName={styles.inputIcon}
                onChange={() => {}}
              />
            }
            onChange={onSelectDate}
            selected={walletCreationDate}
            dateFormat="MMMM d, yyyy"
            locale={AppSettingsService.locale}
            calendarClassName="date-picker-calendar"
            formatWeekDay={nameOfDay => nameOfDay.slice(0, 1)}
            placeholderText="Original creation date (optional)"
          />
          {walletCreationDateIsSelected && (
            <InfoCallout
              type={CalloutType.Warning}
              className={styles.warningCallout}
              text="WARNING: Your wallet will skip any transactions before this date."
            />
          )}
        </div>
      )}
      {showProcessModal && (
        <ProcessNewWalletModal
          walletName={walletName.trim()}
          mnemonic={mnemonic.trim()}
          derivationIndex={
            derivationIndex.length > 0 ? Number(derivationIndex) : undefined
          }
          onSuccessClose={wallet => onSuccess(wallet)}
          onFailClose={onFail}
          defaultProcessingText="Importing wallet..."
          successText="Imported successfully"
          authKey={authKey}
          isViewOnlyWallet={false}
          originalCreationTimestamp={walletCreationTimestamp}
        />
      )}
    </GenericModal>)
  );
};

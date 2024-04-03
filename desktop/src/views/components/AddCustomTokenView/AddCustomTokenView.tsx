import { isDefined } from '@railgun-community/shared-models';
import React, { useEffect, useState } from 'react';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { Text } from '@components/Text/Text';
import { TextButton } from '@components/TextButton/TextButton';
import { AddTokensData } from '@models/drawer-types';
import {
  getERC20TokenDetails,
  logDevError,
  SearchableERC20,
  TokenIconKey,
  useReduxSelector,
  validateCustomTokenFields,
  validateERC20TokenContract,
} from '@react-shared';
import { ErrorDetailsModal } from '@screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import { IconType } from '@services/util/icon-service';
import styles from './AddCustomTokenView.module.scss';

type Props = {
  initialAddTokensData?: AddTokensData;
  initialFullToken?: SearchableERC20;
  onSuccess: (token: SearchableERC20) => void;
  isAddingToken?: boolean;
  disableEditing?: boolean;
};

export const AddCustomTokenView: React.FC<Props> = ({
  initialAddTokensData,
  isAddingToken,
  initialFullToken,
  onSuccess,
  disableEditing,
}) => {
  const { network } = useReduxSelector('network');

  const [hasValidTokenContract, setHasValidTokenContract] = useState(false);
  const [foundToken, setFoundToken] =
    useState<Optional<SearchableERC20>>(undefined);

  const [contractAddress, setContractAddress] = useState('');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState('');
  const [showErrorDetailsModal, setShowErrorDetailsModal] = useState(false);
  const [icon, setIcon] = useState<Optional<TokenIconKey>>();
  const [logoURI, setLogoURI] = useState<Optional<string>>();
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Optional<Error>>(undefined);

  useEffect(() => {
    if (
      initialAddTokensData &&
      isDefined(initialAddTokensData.customTokenAddress)
    ) {
      setContractAddress(initialAddTokensData.customTokenAddress);
    }
    if (isDefined(initialFullToken)) {
      setFoundToken(initialFullToken);
      setContractAddress(initialFullToken.address);
      setHasValidTokenContract(true);
      setName(initialFullToken.name);
      setSymbol(initialFullToken.symbol);
      setDecimals(String(initialFullToken.decimals));
      setIcon(initialFullToken.icon);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearStates = () => {
    setError(undefined);
    setFoundToken(undefined);
    setName('');
    setSymbol('');
    setDecimals('');
    setIcon(undefined);
    setLogoURI(undefined);
  };

  useEffect(() => {
    if (!isDefined(initialFullToken)) {
      clearStates();

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      pullCoinInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractAddress]);

  const openErrorDetailsModal = () => {
    setShowErrorDetailsModal(true);
  };
  const dismissErrorDetailsModal = () => {
    setShowErrorDetailsModal(false);
  };

  const pullCoinInfo = async () => {
    try {
      if (!contractAddress.length) {
        return;
      }

      const isValidTokenContract = await validateERC20TokenContract(
        network.current.name,
        contractAddress,
      );
      setHasValidTokenContract(isValidTokenContract);
      if (!isValidTokenContract) {
        throw new Error('Invalid token address');
      }

      setIcon(undefined);
      setDecimals('');
      setIsSearching(true);
      const searchCoin: SearchableERC20 = await getERC20TokenDetails(
        contractAddress,
        network.current,
      );
      setIsSearching(false);

      setDecimals(String(searchCoin.decimals));

      if (searchCoin.name !== '' && searchCoin.symbol !== '') {
        setFoundToken(searchCoin);
        setName(searchCoin.name);
        setSymbol(searchCoin.symbol);
        setLogoURI(searchCoin.logoURI);
      }
    } catch (cause) {
      setIsSearching(false);
      const err = new Error(
        `Could not get token details for ${network.current.publicName}`,
        { cause },
      );
      logDevError(err);
      setError(err);
      setFoundToken(undefined);
      return;
    }
  };

  const onAddToken = () => {
    try {
      const token = validateCustomTokenFields(
        contractAddress,
        foundToken,
        hasValidTokenContract,
        name,
        symbol,
        decimals,
        icon,
        logoURI,
      );
      if (token) {
        onSuccess(token);
      }
    } catch (cause) {
      setError(new Error('Could not add token', { cause }));
    }
  };

  return (
    <div className={styles.customTokenScreenContainer}>
      <Text className={styles.label}>Token address:</Text>
      <Input
        isTextArea
        placeholder="0x0"
        value={contractAddress}
        onChange={e => setContractAddress(e.target.value)}
        hasError={contractAddress !== '' && !hasValidTokenContract}
        endIcon={hasValidTokenContract ? IconType.Check : IconType.Edit}
        maxLength={42}
        autoCapitalize="none"
        iconClassName={styles.checkmarkIcon}
        disabled={disableEditing}
      />
      <div className={styles.spacer} />
      <Text className={styles.label}>Name:</Text>
      <Input
        placeholder="e.g. Railgun"
        value={isSearching ? 'Loading...' : name}
        onChange={e => setName(e.target.value)}
        disabled={isDefined(foundToken) || isSearching || disableEditing}
        maxLength={24}
      />
      <div className={styles.spacer} />
      <Text className={styles.label}>Symbol:</Text>
      <Input
        placeholder="e.g. RAIL"
        value={isSearching ? 'Loading...' : symbol}
        onChange={e => setSymbol(e.target.value.toUpperCase())}
        disabled={isDefined(foundToken) || isSearching || disableEditing}
        autoCapitalize="characters"
        maxLength={16}
      />
      <div className={styles.spacer} />
      <Button
        children={
          isDefined(isAddingToken) && isAddingToken ? 'Adding Token...' : 'Add'
        }
        disabled={isAddingToken}
        onClick={onAddToken}
        buttonClassName={styles.submitButton}
      />
      <div className={styles.spacer} />
      <div className={styles.errorTextWrapper}>
        {isDefined(error) && (
          <>
            <Text className={styles.errorText}>{error.message}</Text>
            <div className={styles.errorShowMore}>
              <TextButton text="Show more" action={openErrorDetailsModal} />
            </div>
          </>
        )}
      </div>
      {showErrorDetailsModal && isDefined(error) && (
        <ErrorDetailsModal error={error} onDismiss={dismissErrorDetailsModal} />
      )}
    </div>
  );
};

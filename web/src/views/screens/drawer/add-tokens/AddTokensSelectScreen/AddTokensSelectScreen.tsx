import { useEffect, useState } from 'react';
import cn from 'classnames';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { Text } from '@components/Text/Text';
import { EVENT_CLOSE_DRAWER } from '@models/drawer-types';
import {
  compareTokens,
  DEFAULT_SEARCH_TOKENS_FOR_NETWORK,
  getWalletTransactionHistory,
  RailgunTransactionHistorySync,
  SearchableERC20,
  searchableERC20s,
  useAppDispatch,
  useReduxSelector,
  WalletTokenService,
} from '@react-shared';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { IconType } from '@services/util/icon-service';
import { AddTokensView, AddTokensViewData, NO_TOKENS_TEXT } from '../AddTokens';
import { AddTokenList } from './AddTokenList/AddTokenList';
import styles from './AddTokensSelectScreen.module.scss';

type Props = {
  customToken?: SearchableERC20;
  handleSetView: (view: AddTokensView, data: AddTokensViewData) => void;
  selectedTokens: SearchableERC20[];
  setSelectedTokens: (t: SearchableERC20[]) => void;
  selectedTokensText: string;
  setSelectedTokensText: (s: string) => void;
};

export enum ActionType {
  SEND_TOKENS = 'SEND_TOKENS',
  RECEIVE_TOKENS = 'RECEIVE_TOKENS',
}

export const AddTokensSelectScreen = ({
  customToken,
  handleSetView,
  selectedTokens,
  setSelectedTokens,
  selectedTokensText,
  setSelectedTokensText,
}: Props) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const [searchedTokens, setSearchedTokens] =
    useState<Optional<SearchableERC20[]>>(undefined);
  const [queryString, setQueryString] = useState('');
  const [addingTokens, setAddingTokens] = useState(false);

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (
      customToken &&
      !selectedTokens.some(t => compareTokens(t, customToken))
    ) {
      const isSelected = false;
      onSelectERC20(customToken, isSelected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customToken]);

  const updateQueryString = (value: string) => {
    setQueryString(value);
    const searchTokens: Optional<SearchableERC20[]> =
      value === '' ? undefined : searchableERC20s(value, network.current.name);
    setSearchedTokens(searchTokens);
  };

  const updateSelectedTokenText = (tokenList: SearchableERC20[]) => {
    const tokenSymbols = tokenList.map(t => t.symbol);
    const selectedTokenText = tokenSymbols.length
      ? `${tokenSymbols.join(', ')} selected.`
      : NO_TOKENS_TEXT;
    setSelectedTokensText(selectedTokenText);
  };

  const onSelectERC20 = (token: SearchableERC20, isSelected: boolean) => {
    const newTokenList = isSelected
      ? selectedTokens.filter(t => t.address !== token.address)
      : [...selectedTokens, token];

    setSelectedTokens(newTokenList);
    updateSelectedTokenText(newTokenList);
  };

  const saveSelection = async () => {
    const walletTokenService = new WalletTokenService(dispatch);
    const activeWallet = wallets.active;
    if (activeWallet) {
      setAddingTokens(true);
      await walletTokenService.addERC20TokensToWallet(
        activeWallet,
        selectedTokens,
        network.current,
      );
      setAddingTokens(false);
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    RailgunTransactionHistorySync.safeSyncTransactionHistory(
      dispatch,
      network.current,
      getWalletTransactionHistory,
    );

    drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
  };

  const onPressCustomToken = () => {
    handleSetView(AddTokensView.CUSTOM, undefined);
  };

  return (
    <>
      <div className={styles.addTokensSelectScreenContainer}>
        <div className={styles.actionContainer}>
          <div className={styles.searchContainer}>
            <Input
              value={queryString}
              onChange={e => updateQueryString(e.target.value)}
              startIcon={IconType.Search}
              placeholder="Search"
            />
          </div>
          <Button
            endIcon={IconType.Plus}
            buttonClassName={styles.customTokenButton}
            textClassName={styles.customTokenButtonText}
            onClick={onPressCustomToken}
          >
            Custom Token
          </Button>
        </div>
        <div className={cn(styles.cardContainer, 'hide-scroll')}>
          <AddTokenList
            handleSetView={handleSetView}
            searchedTokens={searchedTokens}
            currentTokens={
              wallets.active?.addedTokens[network.current.name] ?? []
            }
            defaultTokens={
              DEFAULT_SEARCH_TOKENS_FOR_NETWORK[network.current.name]
            }
            selectedTokens={selectedTokens}
            onSelectERC20={onSelectERC20}
          />
        </div>
      </div>
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <Text className={styles.selectedTokens}>{selectedTokensText}</Text>
          <Button
            children="Done adding tokens"
            onClick={saveSelection}
            disabled={addingTokens || selectedTokens.length === 0}
            buttonClassName={styles.saveButton}
          />
        </div>
      </footer>
    </>
  );
};

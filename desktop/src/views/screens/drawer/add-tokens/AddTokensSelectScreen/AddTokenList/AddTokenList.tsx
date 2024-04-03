import { isDefined } from '@railgun-community/shared-models';
import { ReactNode } from 'react';
import { Text } from '@components/Text/Text';
import { ERC20ListRow } from '@components/TokenListRow/ERC20ListRow/ERC20ListRow';
import {
  compareTokenAddress,
  compareTokens,
  createERC20TokenFromSearchableERC20,
  ERC20Token,
  ERC20TokenFullInfo,
  getAddedTokensFromNotActiveWallets,
  SearchableERC20,
  shortenTokenAddress,
  useReduxSelector,
} from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import { AddTokensView, AddTokensViewData } from '../../AddTokens';
import styles from './AddTokenList.module.scss';

type Props = {
  searchedTokens: Optional<SearchableERC20[]>;
  currentTokens: ERC20Token[];
  selectedTokens: SearchableERC20[];
  defaultTokens: SearchableERC20[];
  onSelectERC20: (token: SearchableERC20, isSelected: boolean) => void;
  handleSetView: (view: AddTokensView, data: AddTokensViewData) => void;
};

export const AddTokenList: React.FC<Props> = ({
  searchedTokens,
  currentTokens,
  selectedTokens,
  defaultTokens,
  onSelectERC20,
  handleSetView,
}) => {
  const {
    omittedPrivateTokens: { omittedPrivateTokens },
  } = useReduxSelector('omittedPrivateTokens');
  const { wallets } = useReduxSelector('wallets');
  const { network } = useReduxSelector('network');
  const addedTokensFromAllWallets = getAddedTokensFromNotActiveWallets(
    wallets,
    network.current.name,
  );

  const renderSearchedToken = (item: SearchableERC20, index: number) => {
    let walletToken: SearchableERC20 | ERC20TokenFullInfo = item;
    if (isDefined(item.logoURI)) {
      walletToken = createERC20TokenFromSearchableERC20(item);
    }

    const selected = selectedTokens.some(t => compareTokens(t, walletToken));

    let disabled = false;
    let description = walletToken.symbol;
    let rightView: Optional<() => ReactNode>;
    let onSelect = () => {
      onSelectERC20(item, selected);
    };

    if (currentTokens.find(t => compareTokens(t, walletToken))) {
      disabled = true;
      rightView = () => {
        return (
          <div className={styles.addedContainer}>
            <Text className={styles.addedText}>Added</Text>
          </div>
        );
      };
    }

    if (walletToken.symbol === '') {
      onSelect = () => {
        handleSetView(AddTokensView.CUSTOM, {
          customTokenAddress: item.address,
        });
      };
      description = shortenTokenAddress(walletToken.address);
      rightView = () => {
        return (
          <div className={styles.addedContainer}>
            <Text className={styles.addTokenInfoText}>Add token info</Text>
            {renderIcon(IconType.ChevronRight, 18)}
          </div>
        );
      };
    }

    return (
      <ERC20ListRow
        key={index}
        token={walletToken}
        description={description}
        descriptionClassName={styles.descriptionStyle}
        onSelect={onSelect}
        rightView={rightView}
        disabled={disabled}
        selected={selected}
        defaultNoBorder
      />
    );
  };

  let showTokens: SearchableERC20[];
  let tokenHeaderText: string;

  if (searchedTokens) {
    showTokens = searchedTokens;
    tokenHeaderText = 'Search results';
  } else {
    showTokens = defaultTokens ?? [];
    tokenHeaderText = 'Popular';
  }

  const sortedOmittedPrivateTokens = omittedPrivateTokens
    .map((token: SearchableERC20) => {
      const newAddedCustomToken = selectedTokens.find(selectedToken =>
        compareTokenAddress(token.address, selectedToken.address),
      );

      if (newAddedCustomToken) {
        return newAddedCustomToken;
      }

      return token;
    })
    .sort((a: SearchableERC20, b: SearchableERC20) => {
      if (a.name !== '' && b.name === '') {
        return -1;
      } else if (a.name === '' && b.name !== '') {
        return 1;
      } else {
        return 0;
      }
    });

  return (
    <div className={styles.tokenListContentContainer}>
      <div className={styles.tokenList}>
        {sortedOmittedPrivateTokens.length > 0 && !searchedTokens && (
          <div className={styles.noAddedTokensContainer}>
            <Text className={styles.listHeader}>{'Found Tokens'}</Text>
            {sortedOmittedPrivateTokens.map(renderSearchedToken)}
          </div>
        )}
        {addedTokensFromAllWallets.length > 0 && !searchedTokens && (
          <div className={styles.noAddedTokensContainer}>
            <Text className={styles.listHeader}>
              {'Tokens In Other Wallets'}
            </Text>
            {addedTokensFromAllWallets.map(renderSearchedToken)}
          </div>
        )}
        <Text className={styles.listHeader}>{tokenHeaderText}</Text>
        {showTokens.map(renderSearchedToken)}
      </div>
    </div>
  );
};

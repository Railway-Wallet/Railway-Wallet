import {
  isDefined,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import React, { useRef, useState } from 'react';
import { Button } from '@components/Button/Button';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import { TextButton } from '@components/TextButton/TextButton';
import { useForceUpdate } from '@hooks/useForceUpdate';
import { DrawerName, EVENT_OPEN_DRAWER_WITH_DATA } from '@models/drawer-types';
import {
  ERC20Token,
  SelectTokenPurpose,
  tokenBalancesForWalletAndState,
  TransactionType,
  useReduxSelector,
  useSelectableTokens,
} from '@react-shared';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { IconType } from '@services/util/icon-service';
import { SelectERC20List } from './SelectTokenList/SelectERC20List';
import styles from './SelectTokenModal.module.scss';

type Props = {
  headerTitle: string;
  skipBaseToken: boolean;
  onDismiss: (token?: ERC20Token) => void;
  isRailgun: boolean;
  purpose: SelectTokenPurpose;
  transactionType: TransactionType | null;
  hasExistingTokenAmounts?: boolean;
  showAddTokensButton?: boolean;
  useRelayAdaptForRelayerFee: boolean;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
};

export const SelectERC20Modal: React.FC<Props> = ({
  onDismiss,
  isRailgun,
  headerTitle,
  skipBaseToken,
  purpose,
  transactionType,
  hasExistingTokenAmounts,
  showAddTokensButton = false,
  useRelayAdaptForRelayerFee,
  balanceBucketFilter,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { erc20BalancesNetwork } = useReduxSelector('erc20BalancesNetwork');
  const { erc20BalancesRailgun } = useReduxSelector('erc20BalancesRailgun');
  const { txidVersion } = useReduxSelector('txidVersion');

  const [isLoading, setIsLoading] = useState(false);
  const loadingTimeout = useRef<Optional<NodeJS.Timeout>>(undefined);

  const { forceUpdate } = useForceUpdate();

  const activeWallet = wallets.active;

  const { addedTokens } = useSelectableTokens(
    purpose,
    transactionType,
    skipBaseToken,
    hasExistingTokenAmounts,
  );

  if (!addedTokens.length) {
    return null;
  }

  const erc20BalancesSerialized = tokenBalancesForWalletAndState(
    activeWallet,
    erc20BalancesNetwork.forNetwork[network.current.name],
    erc20BalancesRailgun.forNetwork[network.current.name],
    isRailgun,
    txidVersion.current,
    balanceBucketFilter,
  );

  const addNewTokens = () => {
    onDismiss();
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.AddTokens,
    });
  };

  const showRefreshButton = purpose === SelectTokenPurpose.RelayerFee;

  return (
    <GenericModal
      onClose={onDismiss}
      title={headerTitle}
      accessoryView={
        showRefreshButton ? (
          <Button
            onClick={() => {
              setIsLoading(true);
              if (isDefined(loadingTimeout.current)) {
                clearTimeout(loadingTimeout.current);
              }
              forceUpdate();
              loadingTimeout.current = setTimeout(() => {
                loadingTimeout.current = undefined;
                setIsLoading(false);
              }, 500);
            }}
            endIcon={IconType.Refresh}
            loading={isLoading}
          >
            Refresh
          </Button>
        ) : undefined
      }
    >
      <div className={styles.wrapper}>
        <SelectERC20List
          addedTokens={addedTokens}
          erc20BalancesSerialized={erc20BalancesSerialized}
          isRailgun={isRailgun}
          wallet={activeWallet}
          onSelect={(token: ERC20Token) => onDismiss(token)}
          purpose={purpose}
          useRelayAdaptForRelayerFee={useRelayAdaptForRelayerFee}
        />
        <div className={styles.footer}>
          <div className={styles.footerContent}>
            <Text className={styles.footerText}>
              Showing{isRailgun ? ' private ' : ' '}tokens added to wallet:{' '}
              {activeWallet?.name ?? 'Unknown'}.
            </Text>
            {showAddTokensButton && (
              <div className={styles.footerTextButtonWrapper}>
                <TextButton text="Add new tokens?" action={addNewTokens} />
              </div>
            )}
          </div>
        </div>
      </div>
    </GenericModal>
  );
};

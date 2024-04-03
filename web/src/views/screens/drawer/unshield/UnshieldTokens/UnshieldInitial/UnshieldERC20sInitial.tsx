import {
  isDefined,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';
import cn from 'classnames';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { ERC20AmountsEntry } from '@components/amounts-entry/ERC20AmountsEntry';
import { Button } from '@components/Button/Button';
import { Text } from '@components/Text/Text';
import { useRecipientAddress } from '@hooks/useRecipientAddress';
import {
  ERC20Amount,
  ERC20AmountRecipient,
  ERC20Token,
  getTokenDisplayName,
  hasOnlyWrappedBaseToken,
  SharedConstants,
 StorageService,  TransactionType,
  useReduxSelector,
  WalletAddressType } from '@react-shared';
import { validateWalletAddress } from '@utils/validation';
import {
  UnshieldERC20sConfirmData,
  UnshieldERC20sView,
  UnshieldERC20sViewData,
} from '../UnshieldERC20s';
import styles from './UnshieldInitial.module.scss';

type Props = {
  handleSetView: (
    view: UnshieldERC20sView,
    data: UnshieldERC20sViewData,
  ) => void;
  navigationToken?: ERC20Token;
  initialERC20AmountRecipients?: ERC20AmountRecipient[];
};

export const UnshieldERC20sInitial = ({
  handleSetView,
  navigationToken,
  initialERC20AmountRecipients = [],
}: Props) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const firstInitialRecipient =
    isDefined(initialERC20AmountRecipients) &&
    initialERC20AmountRecipients.length
      ? initialERC20AmountRecipients[0]
      : undefined;

  const [balanceBucketFilter, setBalanceBucketFilter] = useState<
    RailgunWalletBalanceBucket[]
  >([RailgunWalletBalanceBucket.Spendable]);

  const [erc20Amounts, setERC20Amounts] = useState<ERC20Amount[]>(
    initialERC20AmountRecipients.map(tar => ({
      token: tar.token,
      amountString: tar.amountString,
    })),
  );

  const [showAmountEntry, setShowAmountEntry] = useState(
    initialERC20AmountRecipients.length < 1,
  );
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);

  useEffect(() => {
    const checkUnshieldDisclaimer = async () => {
      const hasSeen = await StorageService.getItem(
        SharedConstants.HAS_SEEN_UNSHIELD_DESTINATION_DISCLAIMER,
      );

      if (!isDefined(hasSeen)) {
        setAlert({
          title: 'Careful!',
          message:
            'Unshielding directly to an exchange or broker may result in loss of funds. Only unshield to a self-custodial wallet first before sending on to an exchange or broker.',
          onClose: () => setAlert(undefined),
        });

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        StorageService.setItem(
          SharedConstants.HAS_SEEN_UNSHIELD_DESTINATION_DISCLAIMER,
          '1',
        );
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    checkUnshieldDisclaimer();
  }, []);

  const transactionType = TransactionType.Unshield;
  const walletAddressType = WalletAddressType.Ethereum;

  const { hasValidRecipient, erc20AmountRecipients, recipientInput } =
    useRecipientAddress(
      firstInitialRecipient?.recipientAddress,
      firstInitialRecipient?.externalUnresolvedToWalletAddress,
      erc20Amounts,
      [], transactionType,
      walletAddressType,
      validateWalletAddress,
      setAlert,
    );

  const onTapNext = (isBaseTokenUnshield = false) => {
    const data: UnshieldERC20sConfirmData = {
      erc20AmountRecipients,
      isBaseTokenUnshield,
    };
    handleSetView(UnshieldERC20sView.CONFIRM, data);
  };

  const showBaseTokenUnshieldOptions = hasOnlyWrappedBaseToken(
    erc20AmountRecipients,
    network.current,
  );

  return (
    <>
      <div className={styles.unshieldInitialContainer}>
        <Text className={styles.description}>
          Please enter a public {network.current.shortPublicName} address,
          select tokens and enter amounts to unshield.
        </Text>
        {recipientInput}
        <ERC20AmountsEntry
          transactionType={TransactionType.Unshield}
          canSendMultipleTokens={true}
          isRailgunBalance={true}
          initialToken={navigationToken}
          tokenAmounts={erc20AmountRecipients}
          setTokenAmounts={setERC20Amounts}
          requiresAddTokens={undefined}
          showAmountEntry={showAmountEntry}
          setShowAmountEntry={setShowAmountEntry}
          balanceBucketFilter={balanceBucketFilter}
        />
        {!showBaseTokenUnshieldOptions && (
          <div className={styles.nextButtonWrapper}>
            <Button
              buttonClassName={styles.nextButton}
              disabled={!hasValidRecipient || showAmountEntry}
              textClassName={styles.nextButtonText}
              onClick={() => onTapNext()}
            >
              Next
            </Button>
          </div>
        )}
        {showBaseTokenUnshieldOptions && (
          <div className={styles.nextButtonWrapper}>
            <Button
              buttonClassName={styles.nextButton}
              disabled={!hasValidRecipient || showAmountEntry}
              textClassName={styles.nextButtonText}
              onClick={() => onTapNext(true)}
            >
              Unshield to {network.current.baseToken.symbol}
            </Button>
            <Button
              buttonClassName={cn(styles.nextButton, { marginTop: 8 })}
              disabled={!hasValidRecipient || showAmountEntry}
              textClassName={styles.nextButtonText}
              onClick={() => onTapNext()}
            >
              Unshield to{' '}
              {getTokenDisplayName(
                erc20AmountRecipients[0].token,
                wallets.available,
                network.current.name,
              )}
            </Button>
          </div>
        )}
      </div>
      {alert && <GenericAlert {...alert} />}
    </>
  );
};

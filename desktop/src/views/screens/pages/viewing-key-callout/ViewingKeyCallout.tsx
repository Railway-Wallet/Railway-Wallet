import { isDefined } from '@railgun-community/shared-models';
import React, { useEffect, useState } from 'react';
import cn from 'classnames';
import { Button } from '@components/Button/Button';
import { InfoCallout } from '@components/InfoCallout/InfoCallout';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import {
  CalloutType,
  FrontendWallet,
  getRailgunWalletShareableViewingKey,
  showImmediateToast,
  ToastType,
  useAppDispatch,
} from '@react-shared';
import { IconType } from '@services/util/icon-service';
import { copyToClipboard } from '@utils/clipboard';
import { Constants } from '@utils/constants';
import styles from './ViewingKeyCallout.module.scss';

interface ViewingKeyCalloutProps {
  onNext: () => void;
  wallet: FrontendWallet;
}

export const ViewingKeyCallout: React.FC<ViewingKeyCalloutProps> = ({
  wallet,
  onNext,
}) => {
  const [shareableViewingKey, setShareableViewingKey] =
    useState<Optional<string>>();
  const [blur, setBlur] = useState(true);
  const dispatch = useAppDispatch();

  const blurredKey =
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

  useEffect(() => {
    const getVPK = async () => {
      const shareableViewingKey = await getRailgunWalletShareableViewingKey(
        wallet.railWalletID,
      );
      setShareableViewingKey(shareableViewingKey);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getVPK();
  }, [wallet]);

  const copyViewingKey = async () => {
    if (!isDefined(shareableViewingKey)) {
      return;
    }
    await copyToClipboard(shareableViewingKey);
    dispatch(
      showImmediateToast({
        message:
          'Shareable Private Key copied. Be careful — it can be used to access your transaction history.',
        type: ToastType.Copy,
      }),
    );
  };

  const onLearnMore = () => {
    window.open(Constants.VIEW_ONLY_WALLETS_URL, '_blank');
  };

  return (
    <GenericModal
      onClose={() => {}}
      showClose={false}
      shouldCloseOnOverlayClick={false}
      title="View-Only Private Key"
    >
      <div className={cn(styles.wrapper, 'hide-scroll')}>
        <InfoCallout
          type={CalloutType.Info}
          text={
            'This private viewing key can be used to access your entire transaction history for this 0zk address, across all blockchains, without being able to spend funds.\n\nThis is useful for audit purposes — for example, accountants may use this key to safely view the transaction history of their clients.\n\nBe careful: once shared, access cannot be revoked.'
          }
        />
        <div className={styles.spacer} />
        <div
          className={cn(styles.vpkContainer, {
            viewingKeyBlur: blur,
          })}
        >
          <Text className={cn(styles.vpkText, 'selectable-text')}>
            {blur || !isDefined(shareableViewingKey)
              ? blurredKey
              : shareableViewingKey}
          </Text>
        </div>
        <div className={styles.showViewingKeyContainer}>
          <div
            className={styles.showViewingKeyButton}
            onClick={() => setBlur(!blur)}
          >
            <Text fontSize={16} className={styles.unblurViewingKeyText}>
              {blur ? 'Click to show' : 'Click to hide'}
            </Text>
          </div>
        </div>
        <div className={styles.bottomButtons}>
          <Button
            children={'Copy' ?? 'Loading...'}
            onClick={copyViewingKey}
            textClassName={styles.bottomButtonLabel}
            buttonClassName={styles.bottomButton}
            endIcon={IconType.Copy}
          />
          <Button
            children="Learn More"
            onClick={onLearnMore}
            textClassName={styles.bottomButtonLabel}
            buttonClassName={cn(styles.bottomButton, styles.lastBottomButton)}
            endIcon={IconType.OpenInNew}
          />
        </div>
      </div>
      <Button
        onClick={onNext}
        children="Next"
        buttonClassName={styles.continueButton}
      />
    </GenericModal>
  );
};

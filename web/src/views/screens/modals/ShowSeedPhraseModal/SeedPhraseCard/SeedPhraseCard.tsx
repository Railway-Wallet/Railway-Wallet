import { isDefined } from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';
import cn from 'classnames';
import { Button } from '@components/Button/Button';
import { Text } from '@components/Text/Text';
import {
  showImmediateToast,
  StoredWallet,
  ToastType,
  useAppDispatch,
} from '@react-shared';
import { ShowSeedPhraseQRCodeModal } from '@screens/modals/ShowSeedPhraseQRCodeModal/ShowSeedPhraseQRCodeModal';
import { IconType } from '@services/util/icon-service';
import { WalletSecureStorageWeb } from '@services/wallet/wallet-secure-service-web';
import { copyToClipboard } from '@utils/clipboard';
import { Spinner } from '@views/components/loading/Spinner/Spinner';
import { SeedPhraseWordCard } from '../SeedPhraseWordCard/SeedPhraseWordCard';
import styles from './SeedPhraseCard.module.scss';

interface SeedPhraseProps {
  authKey?: string;
  wallet: StoredWallet;
  setMnemonicWordCount?: (count: number) => void;
  blurSeedPhrase?: boolean;
  onNext?: () => void;
}

export const SeedPhraseCard = ({
  wallet,
  authKey,
  setMnemonicWordCount,
  blurSeedPhrase = false,
  onNext,
}: SeedPhraseProps) => {
  const [isLoadingMnemonic, setIsLoadingMnemonic] = useState<boolean>(false);
  const [mnemonic, setMnemonic] = useState<Optional<string>>();
  const [mnemonicWords, setMnemonicWords] = useState<string[]>([]);
  const [showScanQRCodeModal, setShowScanQRCodeModal] =
    useState<boolean>(false);
  const [blurredMnemonicWords, setBlurredMnemonicWords] = useState<string[]>(
    [],
  );
  const [blur, setBlur] = useState<boolean>(blurSeedPhrase);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isDefined(authKey)) {
      return;
    }
    const getMnemonicWords = async () => {
      setIsLoadingMnemonic(true);
      const walletSecureService = new WalletSecureStorageWeb(authKey);
      const mnemonic = await walletSecureService.getWalletMnemonic(wallet);
      const mnemonicWords = mnemonic.split(' ');
      const blurredMnemonicWords: string[] = [];
      mnemonicWords.forEach(() => blurredMnemonicWords.push('xxxxxx'));
      setBlurredMnemonicWords(blurredMnemonicWords);
      setMnemonic(mnemonic);
      setMnemonicWords(mnemonicWords);

      if (setMnemonicWordCount) {
        setMnemonicWordCount(mnemonicWords.length);
      }
      setIsLoadingMnemonic(false);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getMnemonicWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authKey, wallet]);

  const onCopySeedPhrase = async () => {
    if (!isDefined(mnemonic)) {
      return;
    }
    await copyToClipboard(mnemonic);
    dispatch(
      showImmediateToast({
        message:
          'Seed phrase copied. Be careful - it can be used to access your account.',
        type: ToastType.Copy,
      }),
    );
  };

  if (isLoadingMnemonic) {
    return (
      <div className={styles.spinnerContainer}>
        <Spinner />
        <Text className={styles.loadingLabel}>
          {'Loading encrypted wallet and seed phrase…'}
        </Text>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(styles.cardContainer, {
          seedPhraseBlur: blur,
        })}
      >
        {blur
          ? blurredMnemonicWords.map((text, index) => (
              <SeedPhraseWordCard text={text} key={index} />
            ))
          : mnemonicWords.map((text, index) => (
              <SeedPhraseWordCard text={text} key={index} />
            ))}
      </div>
      {blurSeedPhrase && (
        <div className={styles.showSeedPhraseContainer}>
          <div
            className={styles.showSeedPhraseButton}
            onClick={() => setBlur(!blur)}
          >
            <Text fontSize={16} className={styles.unblurSeedPhraseText}>
              {blur ? 'Click to show' : 'Click to hide'}
            </Text>
          </div>
        </div>
      )}
      <div className={styles.bottomButtons}>
        <Button
          children="Copy"
          onClick={onCopySeedPhrase}
          textClassName={styles.bottomButtonLabel}
          buttonClassName={styles.bottomButton}
          endIcon={IconType.Copy}
        />
        <Button
          children="View QR"
          onClick={() => setShowScanQRCodeModal(true)}
          textClassName={styles.bottomButtonLabel}
          buttonClassName={styles.bottomButton}
          endIcon={IconType.QRCode}
        />
      </div>
      {isDefined(onNext) && (
        <Button
          onClick={onNext}
          children="Next"
          disabled={isLoadingMnemonic}
          buttonClassName={styles.nextButton}
        />
      )}
      {showScanQRCodeModal && (
        <ShowSeedPhraseQRCodeModal
          mnemonic={mnemonic}
          onDismiss={() => setShowScanQRCodeModal(false)}
        />
      )}
    </>
  );
};

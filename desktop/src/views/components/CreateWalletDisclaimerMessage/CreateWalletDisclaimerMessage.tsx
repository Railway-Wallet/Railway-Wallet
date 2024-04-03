import cn from 'classnames';
import { Text } from '@components/Text/Text';
import { Constants } from '@utils/constants';
import styles from './CreateWalletDisclaimerMessage.module.scss';

interface Props {
  customTitle?: string;
  hideTerms?: boolean;
  className?: string;
}

export const CreateWalletDisclaimerMessage = ({
  customTitle,
  hideTerms = false,
  className,
}: Props) => {
  const disclaimerTextStyle = cn(styles.disclaimerText, className);

  return (
    <>
      <Text className={disclaimerTextStyle}>
        {customTitle ??
          'Your wallet data is encrypted using your password hash and stored securely in your browser.'}
      </Text>
      {!hideTerms && (
        <Text className={disclaimerTextStyle}>
          By continuing, you verify you have read & agree to the Railway Wallet{' '}
          <a
            href={Constants.TERMS_URL}
            target="_blank"
            rel="noreferrer"
            className={styles.disclaimerLink}
          >
            terms of use
          </a>
          .
        </Text>
      )}
    </>
  );
};

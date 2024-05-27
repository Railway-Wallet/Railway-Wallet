import { isDefined } from '@railgun-community/shared-models';
import cn from 'classnames';
import {
  AlertButtonPosition,
  AlertProps,
} from '@components/alerts/GenericAlert/GenericAlert';
import {
  AppDispatch,
  AppSettingsService,
  Currency,
  domainFromURL,
  POIDocumentation,
  shortenWalletAddress,
  showImmediateToast,
  ToastType,
} from '@react-shared';
import { Button } from '@views/components/Button/Button';
import { copyToClipboard } from './clipboard';
import styles from './utils.module.scss';

export enum ExternalSiteAlertMessages {
  OPEN_EXTERNAL_SITE = 'You are opening an external site, which may not have the same privacy guarantees of Railway Wallet. Viewing this risks correlating your IP address.',
  OPEN_EXTERNAL_TRANSACTION = 'You are opening this transaction on an external site, which may not have the same privacy guarantees of Railway Wallet. Viewing this transaction on an external site risks correlating your IP address.',
}

export const createExternalSiteAlert = (
  url: string,
  setAlert: React.Dispatch<React.SetStateAction<AlertProps | undefined>>,
  dispatch: AppDispatch,
  customMessage?: string,
) => {
  setAlert({
    submitButtonClassName: styles.fullLengthButtonStyle,
    buttonPosition: AlertButtonPosition.BottomCenter,
    title: 'Warning: External Site',
    message: customMessage ?? ExternalSiteAlertMessages.OPEN_EXTERNAL_SITE,
    onClose: () => setAlert(undefined),
    hideSubmitButton: true,
    footerView: (
      <div className={styles.footerButtonsContainer}>
        <Button
          children={`Open ${domainFromURL(url)}`}
          buttonClassName={styles.fullLengthButtonStyle}
          onClick={() => {
            setAlert(undefined);
            if (url) {
              window.open(url, '_blank');
            }
          }}
        />
        <Button
          children="Copy link"
          buttonClassName={styles.fullLengthButtonStyle}
          onClick={async () => {
            setAlert(undefined);
            await copyToClipboard(url);
            dispatch(
              showImmediateToast({
                message: `URL copied to clipboard`,
                type: ToastType.Copy,
              }),
            );
          }}
        />
      </div>
    ),
  });
};

export const createUpdateCurrencyAlert = (
  currency: Currency,
  setAlert: React.Dispatch<React.SetStateAction<AlertProps | undefined>>,
  onSubmit?: () => void,
) => {
  setAlert({
    title: 'Settings updated',
    message: 'Railway will now restart to apply this setting.',
    submitTitle: 'Ok',
    onClose: () => setAlert(undefined),
    onSubmit: async () => {
      await AppSettingsService.setCurrency(currency);
      window.location.reload();
      onSubmit?.();
    },
  });
};

export const createPOIDisclaimerAlert = (
  title: string,
  message: string,
  setAlert: React.Dispatch<React.SetStateAction<AlertProps | undefined>>,
  setExternalLinkAlert: React.Dispatch<
    React.SetStateAction<AlertProps | undefined>
  >,
  dispatch: AppDispatch,
  poiDocumentation?: POIDocumentation,
  customOnSubmit?: () => void,
  customSubmitTitle?: string,
) => {
  const handleRedirect = (url: string) => () => {
    createExternalSiteAlert(url, setExternalLinkAlert, dispatch);
  };

  setAlert({
    title,
    message,
    submitTitle: customSubmitTitle ?? 'I understand',
    submitButtonClassName: styles.singleLineButtonStyle,
    footerView: isDefined(poiDocumentation) ? (
      <div className={styles.footerButtonsContainer}>
        <Button
          children="About RAILGUN's Private POI system"
          buttonClassName={cn(styles.fullLengthButtonStyle, styles.docButton)}
          onClick={handleRedirect(poiDocumentation.railgunPOIDocUrl)}
        />
        <Button
          children="Private POI in Railway Wallet"
          buttonClassName={cn(styles.fullLengthButtonStyle, styles.docButton)}
          onClick={handleRedirect(poiDocumentation.railwayPOIDocUrl)}
        />
      </div>
    ) : undefined,
    onClose: () => setAlert(undefined),
    onSubmit: () => {
      setAlert(undefined);
      customOnSubmit?.();
    },
  });
};

export const createSelfBroadcastDisclaimerAlert = (
  setAlert: React.Dispatch<React.SetStateAction<AlertProps | undefined>>,
  setExternalLinkAlert: React.Dispatch<
    React.SetStateAction<AlertProps | undefined>
  >,
  dispatch: AppDispatch,
) => {
  const handleRedirect = (url: string) => () => {
    createExternalSiteAlert(url, setExternalLinkAlert, dispatch);
  };

  setAlert({
    title: 'Self Broadcast',
    message:
      'Use a wallet you control to sign a private transaction and and broadcast to the blockchain nodes. This wallet will pay gas fees from its public balance. Be sure to follow best practices when self broadcasting to maintain anonymity.',
    submitTitle: 'Okay',
    submitButtonClassName: styles.singleLineButtonStyle,
    footerView: (
      <div className={styles.footerButtonsContainer}>
        <Button
          children="Learn more"
          buttonClassName={cn(styles.fullLengthButtonStyle, styles.docButton)}
          onClick={handleRedirect(
            'https://help.railway.xyz/transactions/self-signing',
          )}
        />
      </div>
    ),
    onClose: () => setAlert(undefined),
    onSubmit: () => {
      setAlert(undefined);
    },
  });
};

export const createPublicBroadcasterDisclaimerAlert = (
  setAlert: React.Dispatch<React.SetStateAction<AlertProps | undefined>>,
  setExternalLinkAlert: React.Dispatch<
    React.SetStateAction<AlertProps | undefined>
  >,
  dispatch: AppDispatch,
) => {
  const handleRedirect = (url: string) => () => {
    createExternalSiteAlert(url, setExternalLinkAlert, dispatch);
  };

  setAlert({
    title: 'Public Broadcaster',
    message:
      'Use a third-party public broadcaster to sign a private transaction and broadcast to the blockchain nodes. This provides more anonymity. Public broadcasters do not ever gain control or custody of your funds and cannot see any details of the sender or the contents of the private transaction. Railway does not control or maintain any broadcasters in the decentralized public broadcaster network.',
    submitTitle: 'Okay',
    submitButtonClassName: styles.singleLineButtonStyle,
    footerView: (
      <div className={styles.footerButtonsContainer}>
        <Button
          children="Learn more"
          buttonClassName={cn(styles.fullLengthButtonStyle, styles.docButton)}
          onClick={handleRedirect(
            'https://docs.railgun.org/wiki/learn/privacy-system/community-broadcasters',
          )}
        />
      </div>
    ),
    onClose: () => setAlert(undefined),
    onSubmit: () => {
      setAlert(undefined);
    },
  });
};

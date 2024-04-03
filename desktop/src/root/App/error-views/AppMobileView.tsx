import React from 'react';
import { Text } from '@components/Text/Text';
import { Constants } from '@utils/constants';
import styles from '../App.module.scss';

type Props = {};

export const AppMobileView: React.FC<Props> = () => {
  const openAppStore = () => {
    window.open(Constants.RAILWAY_IOS_APP_STORE_URL, '_blank');
  };
  const openGooglePlay = () => {
    window.open(Constants.RAILWAY_ANDROID_GOOGLE_PLAY_URL, '_blank');
  };

  return (
    <>
      <div className={styles.appContainer}>
        <div className={styles.mobileContent}>
          <img
            className={styles.mobileLogo}
            src="/railway-circle.png"
            alt="railway-logo-railgun-app"
            width={108}
            height={108}
          />
          <Text className={styles.mobileTitle}>RAILWAY</Text>
          <Text className={styles.mobileDescription}>
            The Railway web app is only available on desktop browsers. Use a
            larger screen size to access on desktop, or install the Railway
            mobile app.
          </Text>
          <div className={styles.mobileStoreLogoWrapper}>
            <img
              className={styles.mobileStoreLogo}
              src="/img/app-store.png"
              alt="apple-app-store"
              width={144}
              onClick={openAppStore}
            />
            <img
              className={styles.mobileStoreLogo}
              src="/img/play-store.png"
              alt="google-play"
              width={144}
              onClick={openGooglePlay}
            />
          </div>
        </div>
        <div className={styles.mobileFooter}>
          <Text className={styles.mobileFooterText}>
            © All rights reserved.
          </Text>
        </div>
      </div>
    </>
  );
};

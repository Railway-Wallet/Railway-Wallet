/// <reference types="user-agent-data-types" />
import { isDefined } from '@railgun-community/shared-models';
import { Provider } from 'react-redux';
import { ReactConfig, store } from '@react-shared';
import { Constants } from '@utils/constants';
import { isElectron } from '../../utils/user-agent';
import { AppNavigator } from './AppNavigator';
import { AppBrowserNotSupportedView } from './error-views/AppBrowserNotSupportedView';
import { AppMobileView } from './error-views/AppMobileView';
import { ProtectWrapperDev } from './ProtectWrapperDev';

export const App = (): JSX.Element => {
  ReactConfig.IS_DEV =
    (Constants.DEV_MODE || Constants.STAG_MODE) &&
    !Constants.OVERRIDE_PROD_TEST_FOR_DEV;

  ReactConfig.ENABLE_V3 = ReactConfig.IS_DEV;

  if (!ReactConfig.IS_DEV) {
    suppressConsoleLogs();
  }

  const isMobileDevice = window.innerWidth <= 768;
  if (isMobileDevice) {
    return <AppMobileView />;
  }

  const isBrowser = !isElectron();
  if (isBrowser) {
    const hasChromeWindowElement = 'chrome' in window;

    const userAgentData = navigator.userAgentData;
    const isChromiumUserAgent =
      userAgentData?.brands.some(data => data.brand === 'Chromium') ?? false;

    const isCompatibleBrowser = hasChromeWindowElement || isChromiumUserAgent;
    if (!isCompatibleBrowser) {
      return <AppBrowserNotSupportedView />;
    }
  }

  if (ReactConfig.IS_DEV && isDefined(ProtectWrapperDev)) {
    return (
      <ProtectWrapperDev>
        <AppProvider />
      </ProtectWrapperDev>
    );
  } else {
    return <AppProvider />;
  }
};

const suppressConsoleLogs = () => {
  // eslint-disable-next-line no-console
  console.log = () => {};
  // eslint-disable-next-line no-console
  console.warn = () => {};
  // eslint-disable-next-line no-console
};

const AppProvider = (): JSX.Element => (
  <Provider store={store}>
    <AppNavigator />
  </Provider>
);

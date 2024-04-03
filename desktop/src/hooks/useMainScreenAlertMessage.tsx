import { isDefined } from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';
import { AlertProps } from '@components/alerts/GenericAlert/GenericAlert';
import {
  setTempNotification,
  StorageService,
  useAppDispatch,
  useReduxSelector,
  useTempNotification,
} from '@react-shared';
import { Constants } from '@utils/constants';

export const useMainScreenAlertMessage = () => {
  const { tempNotification } = useReduxSelector('tempNotification');

  const dispatch = useAppDispatch();
  const [alertInfo, setAlertInfo] = useState<Optional<AlertProps>>(undefined);

  const currentTempNotification = tempNotification.current;

  useTempNotification();

  useEffect(() => {
    const setAlert = (title: string, message: string) => {
      setAlertInfo({
        title,
        message,
        onClose: () => setAlertInfo(undefined),
      });
    };

    const performChecks = async () => {
      const hasShownUnsupportedBrowserWarning = await StorageService.getItem(
        Constants.HAS_SHOWN_UNSUPPORTED_BROWSER_WARNING,
      );

      const isFirefox = /Firefox/i.test(navigator.userAgent);
      if (!isDefined(hasShownUnsupportedBrowserWarning) && isFirefox) {
        setAlert(
          'Warning: Unsupported Browser',
          'Your transactions will be safe, but you may have a buggy experience. Please use Brave or Chrome, which are tested and supported by the development team.',
        );

        await StorageService.setItem(
          Constants.HAS_SHOWN_UNSUPPORTED_BROWSER_WARNING,
          '1',
        );
      } else if (currentTempNotification) {
        setAlert(currentTempNotification.title, currentTempNotification.text);
        dispatch(setTempNotification(undefined));
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    performChecks();
  }, [dispatch, currentTempNotification]);

  return {
    mainScreenAlert: alertInfo,
  };
};

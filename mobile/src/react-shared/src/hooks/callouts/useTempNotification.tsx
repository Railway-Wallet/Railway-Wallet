import { isDefined } from "@railgun-community/shared-models";
import { useEffect } from "react";
import { SharedConstants } from "../../config/shared-constants";
import { setTempNotification } from "../../redux-store/reducers/temp-notification-reducer";
import { StorageService } from "../../services/storage/storage-service";
import { useAppDispatch, useReduxSelector } from "../hooks-redux";

export const useTempNotification = () => {
  const { remoteConfig } = useReduxSelector("remoteConfig");

  const dispatch = useAppDispatch();
  useEffect(() => {
    const tempNotification = remoteConfig.current?.tempNotification;
    if (tempNotification) {
      const setTempNotificationIfNeeded = async () => {
        const viewedTempNotificationIDsJSON = await StorageService.getItem(
          SharedConstants.VIEWED_TEMP_NOTIFICATIONS
        );

        let viewedTempNotificationIDs: string[] = [];

        if (isDefined(viewedTempNotificationIDsJSON)) {
          viewedTempNotificationIDs = JSON.parse(
            viewedTempNotificationIDsJSON
          ) as string[];
        }

        if (!viewedTempNotificationIDs.includes(tempNotification.id)) {
          dispatch(setTempNotification(tempNotification));

          viewedTempNotificationIDs.push(tempNotification.id);
          await StorageService.setItem(
            SharedConstants.VIEWED_TEMP_NOTIFICATIONS,
            JSON.stringify(viewedTempNotificationIDs)
          );
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      setTempNotificationIfNeeded();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

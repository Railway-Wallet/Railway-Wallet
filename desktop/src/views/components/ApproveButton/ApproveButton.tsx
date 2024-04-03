import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { Button } from '@components/Button/Button';
import {
  SavedTransaction,
  transactionLinkOnExternalScanSite,
  useAppDispatch,
  useReduxSelector,
} from '@react-shared';
import { IconType } from '@services/util/icon-service';
import {
  createExternalSiteAlert,
  ExternalSiteAlertMessages,
} from '@utils/alerts';

type Props = {
  pendingApproveTransaction: Optional<SavedTransaction>;
  buttonClassName: string;
  textClassName: string;
  disabled?: boolean;
  approve: () => void;
  approveText: string;
};

export const ApproveButton = ({
  pendingApproveTransaction,
  buttonClassName,
  textClassName,
  disabled,
  approve,
  approveText,
}: Props) => {
  const { network } = useReduxSelector('network');
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);
  const dispatch = useAppDispatch();

  const promptExternalSite = () => {
    if (pendingApproveTransaction) {
      const url = transactionLinkOnExternalScanSite(
        network.current.name,
        pendingApproveTransaction.id,
      );
      if (isDefined(url)) {
        createExternalSiteAlert(
          url,
          setAlert,
          dispatch,
          ExternalSiteAlertMessages.OPEN_EXTERNAL_TRANSACTION,
        );
      }
    }
  };

  return (
    <>
      {pendingApproveTransaction && (
        <Button
          endIcon={IconType.OpenInNew}
          children="Approving..."
          onClick={promptExternalSite}
          textClassName={textClassName}
          buttonClassName={buttonClassName}
        />
      )}
      {!pendingApproveTransaction && (
        <Button
          endIcon={IconType.CheckCircle}
          children={approveText}
          onClick={approve}
          textClassName={textClassName}
          buttonClassName={buttonClassName}
          disabled={disabled}
        />
      )}
      {alert && <GenericAlert {...alert} />}
    </>
  );
};

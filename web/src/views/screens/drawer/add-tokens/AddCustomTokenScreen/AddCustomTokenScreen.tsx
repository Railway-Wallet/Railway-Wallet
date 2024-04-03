import React from 'react';
import { DrawerBackButton } from '@components/drawer-back-button/DrawerBackButton';
import { AddTokensData } from '@models/drawer-types';
import { AddCustomTokenView } from '@views/components/AddCustomTokenView/AddCustomTokenView';
import { AddTokensView, AddTokensViewData } from '../AddTokens';

type Props = {
  handleSetView: (view: AddTokensView, data: AddTokensViewData) => void;
  initialAddTokensData?: AddTokensData;
};

export const AddCustomTokenScreen: React.FC<Props> = ({
  handleSetView,
  initialAddTokensData,
}) => {
  const goBack = () => {
    handleSetView(AddTokensView.SELECT, { customToken: undefined });
  };

  return (
    <>
      <DrawerBackButton text="Back" handleBackButton={goBack} />
      <AddCustomTokenView
        initialAddTokensData={initialAddTokensData}
        onSuccess={token => {
          handleSetView(AddTokensView.SELECT, { customToken: token });
        }}
      />
    </>
  );
};

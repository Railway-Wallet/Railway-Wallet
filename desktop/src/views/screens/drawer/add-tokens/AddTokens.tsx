import { isDefined } from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';
import { AddTokensData } from '@models/drawer-types';
import { SearchableERC20 } from '@react-shared';
import { AddCustomTokenScreen } from './AddCustomTokenScreen/AddCustomTokenScreen';
import { AddTokensSelectScreen } from './AddTokensSelectScreen/AddTokensSelectScreen';

export enum AddTokensView {
  SELECT = 'SELECT',
  CUSTOM = 'CUSTOM',
}

export type AddTokensViewData = AddTokensSelectData | AddTokensData | undefined;
export type AddTokensSelectData = {
  customToken?: SearchableERC20;
};

type Props = {
  initialAddTokensData?: AddTokensData;
};

export const NO_TOKENS_TEXT = 'No tokens selected.';

export const AddTokens: React.FC<Props> = ({ initialAddTokensData }) => {
  const [view, setView] = useState(AddTokensView.SELECT);
  const [viewData, setViewData] = useState<AddTokensViewData>(undefined);
  const [selectedTokens, setSelectedTokens] = useState<SearchableERC20[]>([]);
  const [selectedTokensText, setSelectedTokensText] =
    useState<string>(NO_TOKENS_TEXT);

  useEffect(() => {
    if (
      initialAddTokensData &&
      isDefined(initialAddTokensData.customTokenAddress)
    ) {
      setView(AddTokensView.CUSTOM);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetView = (view: AddTokensView, data?: AddTokensViewData) => {
    setView(view);
    setViewData(data);
  };

  return (
    <>
      {view === AddTokensView.SELECT && (
        <AddTokensSelectScreen
          customToken={(viewData as AddTokensSelectData)?.customToken}
          handleSetView={handleSetView}
          selectedTokens={selectedTokens}
          setSelectedTokens={setSelectedTokens}
          selectedTokensText={selectedTokensText}
          setSelectedTokensText={setSelectedTokensText}
        />
      )}
      {view === AddTokensView.CUSTOM && (
        <AddCustomTokenScreen
          handleSetView={handleSetView}
          initialAddTokensData={
            initialAddTokensData ?? (viewData as AddTokensData)
          }
        />
      )}
    </>
  );
};

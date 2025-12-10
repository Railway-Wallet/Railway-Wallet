import type { AnyAction } from 'redux';

export type UITabsState = {
  activeTab?: string;
  isNFTTabActive?: boolean;
};

export enum UITabsActionType {
  SET_NFT_TAB_ACTIVE = 'ui-tabs/SET_NFT_TAB_ACTIVE',
}

type SetNFTTabActiveAction = {
  type: UITabsActionType.SET_NFT_TAB_ACTIVE;
  isActive: boolean;
};

export type UITabsAction = SetNFTTabActiveAction;

const initialState: UITabsState = {
  isNFTTabActive: false,
};

export const setNFTTabActive = (isActive: boolean): SetNFTTabActiveAction => ({
  type: UITabsActionType.SET_NFT_TAB_ACTIVE,
  isActive,
});

export const uiTabsReducer = (
  state: UITabsState = initialState,
  action: AnyAction,
): UITabsState => {
  switch (action.type) {
    case UITabsActionType.SET_NFT_TAB_ACTIVE: {
      return {
        ...state,
        isNFTTabActive: action.isActive,
      };
    }
    default:
      return state;
  }
};


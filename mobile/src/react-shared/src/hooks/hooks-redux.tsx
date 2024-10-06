import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux-store/store";

export const useAppDispatch = () => useDispatch<AppDispatch>();

const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useReduxSelector = <Key extends keyof RootState>(
  key: Key
): Record<Key, RootState[Key]> => {
  const value: RootState[Key] = useAppSelector((state) => state[key]);
  return { [key]: value } as Record<Key, RootState[Key]>;
};

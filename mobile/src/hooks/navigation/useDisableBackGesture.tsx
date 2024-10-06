import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { AppDispatch, setBackGesturesEnabled } from "@react-shared";

export const useDisableBackGesture = (dispatch: AppDispatch) => {
  useFocusEffect(
    useCallback(() => {
      dispatch(setBackGesturesEnabled(false));

      return () => dispatch(setBackGesturesEnabled(true));
    }, [dispatch])
  );
};

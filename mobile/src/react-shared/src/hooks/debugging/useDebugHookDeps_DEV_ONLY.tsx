import { useWhatChanged } from "@simbathesailor/use-what-changed";

export const useDebugHookDeps_DEV_ONLY = (deps: object) => {
  useWhatChanged(Object.values(deps), Object.keys(deps).join(", "));
};

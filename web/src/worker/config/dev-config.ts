let DEV_MODE = false;

export const isDev = () => {
  return DEV_MODE;
};

export const setIsDev = (dev: boolean) => {
  DEV_MODE = dev;
};

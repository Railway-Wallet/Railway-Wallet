type TokenIcon =
  | {
      uri: string;
    }
  | string;

export const parseTokenIcon = (tokenIcon: TokenIcon): string => {
  return typeof tokenIcon === 'object' ? tokenIcon.uri : tokenIcon;
};

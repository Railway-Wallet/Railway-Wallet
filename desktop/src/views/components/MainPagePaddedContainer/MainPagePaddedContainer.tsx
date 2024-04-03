import { isDefined } from '@railgun-community/shared-models';
import styles from './MainPagePaddedContainer.module.scss';

type Props = {
  children: React.ReactNode;
  widthOverride?: string;
  maxWidth?: number | string;
  minWidth?: number;
};

export const MainPagePaddedContainer = ({
  children,
  widthOverride,
  maxWidth,
  minWidth,
}: Props) => {
  return (
    <div
      className={styles.container}
      style={Object.assign(
        {},
        isDefined(widthOverride) ? { width: widthOverride } : undefined,
        isDefined(maxWidth) ? { maxWidth } : undefined,
        isDefined(minWidth) ? { minWidth } : undefined,
      )}
    >
      {children}
    </div>
  );
};

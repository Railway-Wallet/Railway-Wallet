import {
  isDefined,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { InfoCallout } from '@components/InfoCallout/InfoCallout';
import { useWalletCallout } from '@react-shared';
import styles from './WalletInfoCallout.module.scss';

type Props = {
  balanceBucketFilter: RailgunWalletBalanceBucket[];
};

export const WalletInfoCallout: React.FC<Props> = ({ balanceBucketFilter }) => {
  const { text, calloutType } = useWalletCallout(balanceBucketFilter);
  if (!isDefined(text) || !isDefined(calloutType)) {
    return null;
  }

  return (
    <InfoCallout
      text={text}
      type={calloutType}
      className={styles.infoCallout}
    />
  );
};

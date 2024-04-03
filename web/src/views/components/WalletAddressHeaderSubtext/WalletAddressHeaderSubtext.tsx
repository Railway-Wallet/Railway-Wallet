import { isDefined } from '@railgun-community/shared-models';
import { TextButton } from '@components/TextButton/TextButton';
import {
  shortenWalletAddress,
  showImmediateToast,
  ToastType,
  useAppDispatch,
  useReduxSelector,
} from '@react-shared';
import { copyToClipboard } from '@utils/clipboard';
import styles from './WalletAddressHeaderSubtext.module.scss';

type Props = {
  isRailgun?: boolean;
};

export const WalletAddressHeaderSubtext = ({ isRailgun }: Props) => {
  const { wallets } = useReduxSelector('wallets');

  const dispatch = useAppDispatch();

  const activeWallet = wallets.active;
  if (!activeWallet || isRailgun == null) {
    return null;
  }

  const walletAddress = isDefined(activeWallet)
    ? isRailgun || activeWallet.isViewOnlyWallet
      ? activeWallet.railAddress
      : activeWallet.ethAddress
    : '';

  const copyWalletAddress = async () => {
    if (!walletAddress) {
      return;
    }
    await copyToClipboard(walletAddress);
    dispatch(
      showImmediateToast({
        message: isRailgun
          ? `RAILGUN address copied. Paste elsewhere to share.`
          : 'Public wallet address copied. Paste elsewhere to share.',
        type: ToastType.Copy,
      }),
    );
  };

  return (
    <TextButton
      text={`${activeWallet.name}: ${shortenWalletAddress(walletAddress)}`}
      action={copyWalletAddress}
      textClassName={styles.headerSubtext}
    />
  );
};

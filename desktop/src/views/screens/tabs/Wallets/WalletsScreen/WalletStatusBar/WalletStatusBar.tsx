import { isDefined } from '@railgun-community/shared-models';
import { Button } from '@components/Button/Button';
import { Text } from '@components/Text/Text';
import {
  setDiscreetMode,
  useAppDispatch,
  useReduxSelector,
} from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import { getGradientColor } from '@utils/colors';
import styles from './WalletStatusBar.module.scss';

type Props = {
  isRailgun: boolean;
  displayingAssetDescription: string;
  setIsRailgun?: (isRailgun: boolean) => void;
  setShowWalletSelectorModal: (show: boolean) => void;
  hidePrivatePublicButton?: boolean;
};

export const WalletStatusBar = ({
  isRailgun,
  displayingAssetDescription,
  hidePrivatePublicButton,
  setIsRailgun,
  setShowWalletSelectorModal,
}: Props) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { discreetMode } = useReduxSelector('discreetMode');
  const dispatch = useAppDispatch();

  const activeWallet = wallets.active;
  const isHorizontalGradient = true;
  const hideSwitchButton =
    (isDefined(hidePrivatePublicButton) || wallets.active?.isViewOnlyWallet) ??
    false;

  return (
    <div
      className={styles.barContainer}
      style={{
        background: getGradientColor(
          network.current.name,
          isRailgun,
          isHorizontalGradient,
        ),
      }}
    >
      <div className={styles.innerContainer}>
        <div className={styles.startIcon}>
          {renderIcon(isRailgun ? IconType.Shield : IconType.Public, 28)}
        </div>
        <div className={styles.textContainer}>
          {isRailgun ? (
            <>
              <Text className={styles.mainText}>
                Showing private RAILGUN assets
              </Text>
              <Text className={styles.subText}>
                Shielded {displayingAssetDescription}
              </Text>
            </>
          ) : (
            <>
              <Text className={styles.mainText}>
                Showing public {network.current.shortPublicName} assets
              </Text>
              <Text className={styles.subText}>
                Public {displayingAssetDescription}
              </Text>
            </>
          )}
        </div>
      </div>
      <div className={styles.buttonContainer}>
        <Button
          buttonClassName={styles.button}
          alt="toggle discreet mode"
          onClick={() => dispatch(setDiscreetMode(!discreetMode.enabled))}
          subText={'Discretion'}
          spreadIconsEvenly
        >
          {discreetMode.enabled ? '***' : '123'}
        </Button>
        {!hideSwitchButton && (
          <Button
            buttonClassName={styles.button}
            endIcon={isRailgun ? IconType.Shield : IconType.Public}
            alt="switch private or public"
            onClick={() => setIsRailgun?.(!isRailgun)}
            subText={`Go to ${isRailgun ? 'Public\u2007' : 'Private'}`}
            spreadIconsEvenly
          >
            {isRailgun ? 'Private' : 'Public'}
          </Button>
        )}
        {activeWallet && (
          <Button
            buttonClassName={styles.button}
            textClassName={styles.activeWalletButtonText}
            endIcon={
              activeWallet.isViewOnlyWallet ? IconType.Eye : IconType.Wallet
            }
            alt="select wallet"
            onClick={() => setShowWalletSelectorModal(true)}
            subText="View wallets"
            spreadIconsEvenly
          >
            {activeWallet.name}
          </Button>
        )}
      </div>
    </div>
  );
};

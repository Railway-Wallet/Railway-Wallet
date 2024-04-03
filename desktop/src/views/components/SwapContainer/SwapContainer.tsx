import { isDefined, NetworkName } from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';
import { Button } from '@components/Button/Button';
import { Text } from '@components/Text/Text';
import { TextButton } from '@components/TextButton/TextButton';
import { WalletAddressHeaderSubtext } from '@components/WalletAddressHeaderSubtext/WalletAddressHeaderSubtext';
import {
  ERC20Amount,
  ERC20Token,
  SharedConstants,
  TransactionType,
  useReduxSelector,
  useRemoteConfigNetworkError,
  useTopPickSwapERC20s,
  validERC20Amount,
} from '@react-shared';
import { ErrorDetailsModal } from '@screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import {
  SwapSettings,
  SwapSettingsModal,
} from '@screens/modals/SwapSettingsModal/SwapSettingsModal';
import { IconType } from '@services/util/icon-service';
import { getGradientColor } from '@utils/colors';
import {
  appEventsBus,
  SWAP_COMPLETE,
} from '../../../services/navigation/app-events';
import { AlertProps, GenericAlert } from '../alerts/GenericAlert/GenericAlert';
import { SwapContentProps } from './SwapContent/SharedSwapContent';
import { ZeroXPrivateSwapContent } from './SwapContent/ZeroXPrivateSwapContent';
import { ZeroXPublicSwapContent } from './SwapContent/ZeroXPublicSwapContent';
import styles from './SwapContainer.module.scss';

type Props = {
  navigationToken: Optional<ERC20Token>;
  isRailgun: boolean;
  setIsRailgun: (isRailgun: boolean) => void;
};

export const SwapContainer: React.FC<Props> = ({
  navigationToken,
  isRailgun,
  setIsRailgun,
}: Props) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const [showSwapSettings, setShowSwapSettings] = useState(false);
  const [showErrorDetailsModal, setShowErrorDetailsModal] = useState(false);
  const [slippagePercentageOverride, setSlippagePercentageOverride] =
    useState<Optional<number>>();

  const [alert, setAlert] = useState<Optional<AlertProps>>(undefined);

  const { topPickSellToken, topPickBuyToken } = useTopPickSwapERC20s(
    isRailgun,
    navigationToken,
  );
  const [currentSellERC20, setCurrentSellERC20] =
    useState<Optional<ERC20Token>>(topPickSellToken);
  const [currentBuyERC20, setCurrentBuyERC20] =
    useState<Optional<ERC20Token>>(topPickBuyToken);

  const [sellTokenEntryString, setSellTokenEntryString] = useState('');

  let validSellERC20Amount: Optional<ERC20Amount> = validERC20Amount(
    sellTokenEntryString,
    currentSellERC20,
  );
  if (
    validSellERC20Amount &&
    BigInt(validSellERC20Amount.amountString) === 0n
  ) {
    validSellERC20Amount = undefined;
  }

  const handleSwapComplete = () => {
    setSellTokenEntryString('');
  };

  useEffect(() => {
    appEventsBus.on(SWAP_COMPLETE, handleSwapComplete);
    return () => {
      appEventsBus.remove(SWAP_COMPLETE, handleSwapComplete);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeWallet = wallets.active;

  const defaultSlippagePercentage = isRailgun
    ? SharedConstants.DEFAULT_SLIPPAGE_PRIVATE_TXS
    : SharedConstants.DEFAULT_SLIPPAGE_PUBLIC_TXS;
  const swapSettings: SwapSettings = {
    slippagePercentage: slippagePercentageOverride ?? defaultSlippagePercentage,
  };
  const onDismissSwapSettings = (newSettings?: SwapSettings) => {
    if (newSettings) {
      if (newSettings.slippagePercentage !== swapSettings.slippagePercentage) {
        setSlippagePercentageOverride(newSettings.slippagePercentage);
      }
    }
    setShowSwapSettings(false);
  };

  const openErrorDetailsModal = () => {
    setShowErrorDetailsModal(true);
  };
  const dismissErrorDetailsModal = () => {
    setShowErrorDetailsModal(false);
  };

  const activeWalletError = !activeWallet
    ? new Error('Please connect a wallet.')
    : undefined;

  const { remoteConfigNetworkError } = useRemoteConfigNetworkError(
    TransactionType.Swap,
    isRailgun,
    isRailgun,
  );

  const error = activeWalletError ?? remoteConfigNetworkError;

  const isHorizontalGradient = true;

  const swapContentParams: SwapContentProps = {
    setAlert,
    swapSettings,
    sellERC20: currentSellERC20,
    sellERC20Amount: validSellERC20Amount,
    buyERC20: currentBuyERC20,
    sellTokenEntryString,
    setCurrentSellERC20,
    setCurrentBuyERC20,
    setSellTokenEntryString,
  };

  return (
    <>
      {showSwapSettings && (
        <SwapSettingsModal
          isRailgun={isRailgun}
          currentSettings={swapSettings}
          onDismiss={onDismissSwapSettings}
        />
      )}
      <div className={styles.swapContainer}>
        <div
          className={styles.headerRow}
          style={{
            background: getGradientColor(
              network.current.name,
              isRailgun,
              isHorizontalGradient,
            ),
          }}
        >
          <div>
            <Text className={styles.headerText}>Market swap</Text>
            <WalletAddressHeaderSubtext isRailgun={isRailgun} />
          </div>
          <div className={styles.privatePublicButtonContainer}>
            <Button
              buttonClassName={styles.privatePublicButton}
              endIcon={isRailgun ? IconType.Shield : IconType.Public}
              alt="switch private or public"
              onClick={() => setIsRailgun(!isRailgun)}
            >
              {isRailgun ? 'Private' : 'Public'}
            </Button>
            <Button
              buttonClassName={styles.settingsButton}
              endIcon={IconType.Settings}
              alt="open swap settings"
              onClick={() => setShowSwapSettings(true)}
              iconOnly
            />
          </div>
        </div>
        <div className={styles.cardContentContainer}>
          {isDefined(error) && (
            <>
              <Text className={styles.placeholderError}>{error.message}</Text>
              <TextButton text="Show more" action={openErrorDetailsModal} />
            </>
          )}
          {!isDefined(error) &&
            (isRailgun ? (
              <ZeroXPrivateSwapContent {...swapContentParams} />
            ) : (
              <ZeroXPublicSwapContent {...swapContentParams} />
            ))}
        </div>
      </div>
      {showErrorDetailsModal && isDefined(error) && (
        <ErrorDetailsModal error={error} onDismiss={dismissErrorDetailsModal} />
      )}
      {alert && <GenericAlert {...alert} />}
    </>
  );
};

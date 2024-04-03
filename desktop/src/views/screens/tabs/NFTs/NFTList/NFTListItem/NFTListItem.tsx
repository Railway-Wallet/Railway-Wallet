import { isDefined, NFTAmount } from '@railgun-community/shared-models';
import { useState } from 'react';
import { Tooltip } from 'react-tooltip';
import cn from 'classnames';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { Button } from '@components/Button/Button';
import { NFTImageBackground } from '@components/Image/NFTImageBackground';
import { Spinner } from '@components/loading/Spinner/Spinner';
import { Text } from '@components/Text/Text';
import {
  NFTVerificationStatus,
  styleguide,
  useAppDispatch,
  useNFTImageURLs,
  useNFTMetadata,
  useReduxSelector,
} from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import { createExternalSiteAlert } from '@utils/alerts';
import styles from './NFTListItem.module.scss';

type Props = {
  isRailgun: boolean;
  nftAmount: NFTAmount;
  onActionSend: () => void;
  onActionShield: () => void;
  onActionUnshield: () => void;
};

export const NFTListItem = ({
  nftAmount,
  onActionSend,
  onActionShield,
  onActionUnshield,
  isRailgun,
}: Props) => {
  const dispatch = useAppDispatch();
  const { wallets } = useReduxSelector('wallets');
  const { metadata } = useNFTMetadata(nftAmount);
  const { imageURL } = useNFTImageURLs(metadata);

  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);
  const [isHoveringContainer, setIsHoveringContainer] = useState(false);
  const [isHoveringCollectionName, setIsHoveringCollectionName] =
    useState(false);

  const activeWallet = wallets.active;

  const badgeIcon = () => {
    if (!metadata) {
      return null;
    }

    const iconSize = 17;
    switch (metadata.verificationStatus) {
      case NFTVerificationStatus.Verified:
        return (
          <div
            data-tooltip-content="Verified collection: This NFT collection has been verified by partner services."
            data-tooltip-id="tooltip"
          >
            {renderIcon(
              IconType.CheckCircle,
              iconSize,
              styleguide.colors.txGreen(),
            )}
          </div>
        );
      case NFTVerificationStatus.Approved:
        return (
          <div
            data-tooltip-content="Approved collection: This NFT collection is approved for use but has not been verified by partner services."
            data-tooltip-id="tooltip"
          >
            {renderIcon(
              IconType.EmptyCircle,
              iconSize,
              styleguide.colors.txGreen(),
            )}
          </div>
        );
      case NFTVerificationStatus.Unknown:
        return (
          <div
            data-tooltip-content="Unknown collection: This NFT collection has not been verified by partner services."
            data-tooltip-id="tooltip"
          >
            {renderIcon(
              IconType.Warning,
              iconSize,
              styleguide.colors.txYellow(),
            )}
          </div>
        );
      case NFTVerificationStatus.Spam:
        return (
          <div
            data-tooltip-content="Spam: This NFT collection has been flagged as spam."
            data-tooltip-id="tooltip"
          >
            {renderIcon(IconType.Warning, iconSize, styleguide.colors.txRed())}
          </div>
        );
    }
  };

  const onClickCollectionName =
    isDefined(metadata) && isDefined(metadata.collectionExternalURL)
      ? () =>
          createExternalSiteAlert(
            metadata.collectionExternalURL as string,
            setAlert,
            dispatch,
          )
      : undefined;

  return (<>
    {}
    {!metadata && (
      <div className={styles.container}>
        <div className={styles.imageWrapper}>
          <div className={styles.loadingImage}>
            <Spinner size={36} />
          </div>
        </div>
        <div className={styles.textWrapper}>
          <Text className={styles.title}>Loading...</Text>
        </div>
      </div>
    )}
    {}
    {metadata && (
      <div
        className={styles.container}
        onMouseEnter={() => setIsHoveringContainer(true)}
        onMouseLeave={() => setIsHoveringContainer(false)}
      >
        <div
          className={cn(styles.imageWrapper, {
            [styles.imageWrapperHovered]: isHoveringContainer,
          })}
        >
          <NFTImageBackground className={styles.image} imageURL={imageURL} />
        </div>
        {isHoveringContainer && (
          <div className={styles.buttonsWrapper}>
            <Button
              endIcon={IconType.Send}
              children="Send"
              onClick={onActionSend}
              buttonClassName={styles.button}
              disabled={activeWallet?.isViewOnlyWallet}
            />
            {isRailgun ? (
              <Button
                endIcon={IconType.Public}
                children="Unshield"
                onClick={onActionUnshield}
                buttonClassName={styles.button}
                disabled={activeWallet?.isViewOnlyWallet}
              />
            ) : (
              <Button
                endIcon={IconType.Shield}
                children="Shield"
                onClick={onActionShield}
                buttonClassName={styles.button}
                disabled={activeWallet?.isViewOnlyWallet}
              />
            )}
          </div>
        )}
        <div className={styles.textWrapper}>
          <div className={styles.titleBadgeWrapper}>
            <Text className={styles.title}>{metadata.name}</Text>
            {badgeIcon()}
          </div>
          <div
            onMouseEnter={() =>
              onClickCollectionName && setIsHoveringCollectionName(true)
            }
            onMouseLeave={() =>
              onClickCollectionName && setIsHoveringCollectionName(false)
            }
            onClick={onClickCollectionName}
          >
            <Text
              className={cn(styles.subtitle, {
                [styles.hoveringSubtitle]: isHoveringCollectionName,
              })}
            >
              {metadata.collectionName}
            </Text>
          </div>
        </div>
      </div>
    )}
    {alert && <GenericAlert {...alert} />}
    <Tooltip id="tooltip" place="top" className={styles.tooltip} />
  </>);
};

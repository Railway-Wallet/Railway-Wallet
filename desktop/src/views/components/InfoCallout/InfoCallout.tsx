import { isDefined } from '@railgun-community/shared-models';
import cn from 'classnames';
import { RailgunGradient } from '@components/RailgunGradient/RailgunGradient';
import { Text } from '@components/Text/Text';
import { CalloutType, styleguide } from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import styles from './InfoCallout.module.scss';

type Props = {
  type: CalloutType;
  text: string;
  className?: string;
  borderColor?: string;
  gradientColors?: string[];
  ctaButton?: string;
  onCtaPress?: () => void;
};

export const InfoCallout = ({
  ctaButton,
  onCtaPress,
  text,
  type,
  gradientColors,
  borderColor,
  className,
}: Props) => {
  const iconSize = 24;
  let icon: React.ReactElement;
  switch (type) {
    case CalloutType.Info: {
      icon = renderIcon(IconType.Info, iconSize);
      break;
    }
    case CalloutType.Help: {
      icon = renderIcon(IconType.Help, iconSize);
      break;
    }
    case CalloutType.Warning: {
      icon = renderIcon(IconType.Warning, iconSize);
      break;
    }
    case CalloutType.Secure: {
      icon = renderIcon(IconType.Shield, iconSize);
      break;
    }
    case CalloutType.Insecure: {
      icon = renderIcon(IconType.Public, iconSize);
      break;
    }
    case CalloutType.Unlock: {
      icon = renderIcon(IconType.LockOpen, iconSize);
      break;
    }
    case CalloutType.Create: {
      icon = renderIcon(IconType.PlusCircle, iconSize);
      break;
    }
    default: {
      icon = renderIcon(IconType.Info, iconSize);
      break;
    }
  }

  const ctaButtonText = () => {
    return (
      isDefined(ctaButton) &&
      onCtaPress && (
        <div>
          <Text className={styles.ctaButton} onClick={onCtaPress}>
            {ctaButton}
          </Text>
        </div>
      )
    );
  };

  const content = (
    <div className={styles.contentContainer}>
      <div>{icon}</div>
      <Text className={styles.text}>
        {text} {ctaButtonText()}
      </Text>
    </div>
  );

  const railgunGradientWrapper = (
    <RailgunGradient className={styles.border}>
      <div className={styles.blackCenter}>
        <RailgunGradient
          className={styles.content}
          gradient={styleguide.colors.gradients.railgunDark}
        >
          {content}
        </RailgunGradient>
      </div>
    </RailgunGradient>
  );

  const solidBorderWrapper = () => {
    const gradientStyles = {
      ...styleguide.colors.gradients.railgun,
      colors: gradientColors ?? [],
    };

    return (
      <div
        className={styles.border}
        style={{
          backgroundColor: borderColor,
        }}
      >
        <RailgunGradient className={styles.content} gradient={gradientStyles}>
          {content}
        </RailgunGradient>
      </div>
    );
  };

  return (
    <div className={cn(styles.infoAlertWrapper, className)}>
      {isDefined(borderColor) && isDefined(gradientColors)
        ? solidBorderWrapper()
        : railgunGradientWrapper}
    </div>
  );
};

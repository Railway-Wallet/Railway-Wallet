import { isDefined } from '@railgun-community/shared-models';
import cn from 'classnames';
import { Text } from '@components/Text/Text';
import { styleguide } from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import styles from './ListItem.module.scss';

type Title =
  | React.ReactNode
  | ((props: {
      selectable: boolean;
      ellipsizeMode: EllipsizeProp | undefined;
      color: string;
      fontSize: number;
    }) => React.ReactNode);

type Description =
  | React.ReactNode
  | ((props: {
      selectable: boolean;
      ellipsizeMode: EllipsizeProp | undefined;
      color: string;
      fontSize: number;
    }) => React.ReactNode);

type EllipsizeProp = 'head' | 'middle' | 'tail' | 'clip';

type Props = {
  title: Title;
  description?: Description;
  left?: (props: { color: string; className: string }) => React.ReactNode;
  right?: (props: { color: string; className?: string }) => React.ReactNode;
  onPress?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  descriptionStyle?: React.CSSProperties;
  titleStyle?: React.CSSProperties;
  descriptionContainerClassName?: string;
  titleEllipsizeMode?: EllipsizeProp;
  descriptionEllipsizeMode?: EllipsizeProp;
  disabled?: boolean;
  titleIcon?: IconType;
  titleIconSize?: number;
  evenLeftAndRight?: boolean;
};

export const ListItem = ({
  left,
  right,
  title,
  description,
  onPress,
  className,
  titleClassName,
  titleEllipsizeMode,
  descriptionStyle,
  titleStyle,
  descriptionEllipsizeMode,
  descriptionClassName,
  descriptionContainerClassName,
  titleIcon,
  titleIconSize,
  evenLeftAndRight = false,
}: Props) => {
  const renderDescription = (description?: Description | null) => {
    return typeof description === 'function' ? (
      description({
        selectable: false,
        ellipsizeMode: descriptionEllipsizeMode,
        color: descriptionColor,
        fontSize: 14,
      })
    ) : (
      <Text
        className={cn(styles.description, descriptionClassName)}
        style={descriptionStyle}
      >
        {description}
      </Text>
    );
  };

  const renderTitle = () => {
    const titleColor = styleguide.colors.text();

    return typeof title === 'function' ? (
      title({
        selectable: false,
        ellipsizeMode: titleEllipsizeMode,
        color: titleColor,
        fontSize: 16,
      })
    ) : (
      <div style={{ display: 'flex' }}>
        <Text className={cn(styles.title, titleClassName)} style={titleStyle}>
          {title}
        </Text>
        {titleIcon && (
          <div style={{ paddingLeft: 8 }}>
            {renderIcon(titleIcon, titleIconSize ?? 16)}
          </div>
        )}
      </div>
    );
  };

  const descriptionColor = styleguide.colors.text();

  return (
    <div className={cn(styles.container, className)} onClick={onPress}>
      <div className={styles.row}>
        <div className={styles.leftContainer}>
          {left
            ? left({
                color: descriptionColor,
                className: cn(styles.iconMarginLeft, {
                  [styles.marginVerticalNone]: !isDefined(description),
                }),
              })
            : null}
          <div
            className={cn(
              styles.descriptionContainer,
              descriptionContainerClassName,
            )}
          >
            {renderTitle()}
            {isDefined(description) ? renderDescription(description) : null}
          </div>
        </div>
        <div
          className={cn(
            styles.rightContainer,
            evenLeftAndRight ? styles.rightContainerEven : undefined,
          )}
        >
          {right
            ? right({
                color: descriptionColor,
                className: cn(styles.iconMarginRight, {
                  [styles.marginVerticalNone]: !isDefined(description),
                }),
              })
            : null}
        </div>
      </div>
    </div>
  );
};

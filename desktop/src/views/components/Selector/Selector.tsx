import { isDefined } from '@railgun-community/shared-models';
import { CSSProperties, ReactElement } from 'react';
import Select, {
  components,
  GroupBase,
  OptionProps,
  OptionsOrGroups,
  SingleValueProps,
  ValueContainerProps,
} from 'react-select';
import { renderIcon } from '@services/util/icon-service';
import { styles } from './styles';

export type SelectorOption = {
  name?: string;
  value: string;
  label: string;
  icon?: string;
};

type Props = {
  options: OptionsOrGroups<SelectorOption, GroupBase<SelectorOption>>;
  value?: SelectorOption;
  placeholder: string;
  onValueChange: (option: SelectorOption) => void;
  containerClassName?: string;
  controlClassName?: string;
  accessoryView?: ReactElement;
  menuPortalStyle?: CSSProperties;
  menuPortalTarget?: HTMLElement | null;
  testId?: string;
  small?: boolean;
};

export const Selector = ({
  options,
  value,
  placeholder,
  onValueChange,
  containerClassName,
  controlClassName,
  accessoryView,
  menuPortalStyle = {},
  menuPortalTarget = null,
  testId,
  small = false,
}: Props): JSX.Element => {
  const ValueContainer = ({
    children,
    ...props
  }: ValueContainerProps<
    SelectorOption,
    false,
    GroupBase<SelectorOption>
  >): ReactElement => {
    return isDefined(components.ValueContainer) ? (
      <components.ValueContainer {...props}>
        {isDefined(children) && accessoryView}
        {children}
      </components.ValueContainer>
    ) : (
      <></>
    );
  };

  const CustomOptionSmall = (props: OptionProps<SelectorOption, false>) => {
    const { data, innerRef, innerProps, isFocused, isSelected } = props;

    if (!isDefined(data?.icon)) {
      return null;
    }

    return (
      <div
        ref={innerRef}
        {...innerProps}
        style={{
          ...(small ? styles.optionSmall : styles.option),
          ...(isFocused && styles.focusedOption),
          ...(isSelected && styles.selectedOption),
        }}
      >
        {renderIcon(data.icon, 28)}
      </div>
    );
  };

  const CustomSingleValueSmall = (
    props: SingleValueProps<SelectorOption, false>,
  ) => {
    const { data } = props;

    if (!isDefined(data?.icon)) {
      return null;
    }

    return (
      <div style={styles.singleValueSmall}>{renderIcon(data.icon, 28)}</div>
    );
  };

  const CustomDropdownIndicatorSmall = () => null;

  return (
    <div className={containerClassName} data-testid={testId}>
      <Select
        className={controlClassName}
        options={options}
        value={value}
        isSearchable={false}
        placeholder={placeholder}
        onChange={newValue => {
          if (!newValue) {
            return;
          }

          onValueChange(newValue);
        }}
        components={{
          ValueContainer,
          ...(small && {
            DropdownIndicator: CustomDropdownIndicatorSmall,
            Option: CustomOptionSmall,
            SingleValue: CustomSingleValueSmall,
          }),
        }}
        menuPortalTarget={menuPortalTarget}
        styles={{
          control: (_, state) => ({
            ...styles.control,
            ...(state.isFocused && state.menuIsOpen && styles.focusedControl),
          }),
          indicatorSeparator: () => styles.indicatorSeparator,
          menu: base => ({
            ...base,
            ...styles.menu,
          }),
          menuList: base => ({
            ...base,
            ...styles.menuList,
            ...(small && styles.menuListSmall),
          }),
          option: (_, { isFocused, isSelected }) => ({
            ...styles.option,
            ...(isFocused && styles.focusedOption),
            ...(isSelected && styles.selectedOption),
          }),
          placeholder: () => styles.inputText,
          singleValue: () => styles.inputText,
          valueContainer: base => ({
            ...base,
            ...styles.valueContainer,
            ...(small && styles.valueContainerSmall),
          }),
          menuPortal: base => ({ ...base, ...menuPortalStyle }),
        }}
      />
    </div>
  );
};

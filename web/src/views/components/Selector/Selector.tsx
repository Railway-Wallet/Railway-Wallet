import { isDefined } from '@railgun-community/shared-models';
import { CSSProperties, ReactElement } from 'react';
import Select, {
  components,
  GroupBase,
  OptionsOrGroups,
  ValueContainerProps,
} from 'react-select';
import { styles } from './styles';

export type SelectorOption = {
  name?: string;
  value: string;
  label: string;
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
}: Props): JSX.Element => {
  const ValueContainer = ({
    children,
    ...props
  }: ValueContainerProps): ReactElement => {
    return isDefined(components.ValueContainer) ? (
      <components.ValueContainer {...props}>
        {isDefined(children) && accessoryView}
        {children}
      </components.ValueContainer>
    ) : (
      <></>
    );
  };

  return (
    <div className={containerClassName} data-testid={testId}>
      <Select
        className={controlClassName}
        options={options}
        value={value}
        isSearchable={false}
        placeholder={placeholder}
        // @ts-ignore
        onChange={onValueChange}
        // @ts-ignore
        components={{ ValueContainer }}
        menuPortalTarget={menuPortalTarget}
        styles={{
          control: (_, state) => ({
            ...styles.control,
            ...(state.isFocused && state.menuIsOpen
              ? styles.focusedControl
              : {}),
          }),
          indicatorSeparator: () => styles.indicatorSeparator,
          menu: base => ({
            ...base,
            ...styles.menu,
          }),
          menuList: base => ({
            ...base,
            ...styles.menuList,
          }),
          option: (_, { isFocused, isSelected }) => ({
            ...styles.option,
            ...(isFocused ? styles.focusedOption : {}),
            ...(isSelected ? styles.selectedOption : {}),
          }),
          placeholder: () => styles.inputText,
          singleValue: () => styles.inputText,
          valueContainer: base => ({
            ...base,
            ...styles.valueContainer,
          }),
          menuPortal: base => ({ ...base, ...menuPortalStyle }),
        }}
      />
    </div>
  );
};

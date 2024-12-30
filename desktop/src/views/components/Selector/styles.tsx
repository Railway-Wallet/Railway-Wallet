import { styleguide } from '@react-shared';
import typography from '@scss/typography.module.scss';

export const styles = {
  control: {
    backgroundColor: styleguide.colors.gray6(0.5),
    border: `1px solid ${styleguide.colors.gray9()}`,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center',
    borderRadius: 4,
    boxShadow: 'none',
    height: '100%',
    boxSizing: 'border-box' as 'border-box',
  },
  focusedControl: {
    border: `1px solid ${styleguide.colors.white}`,
    backgroundColor: styleguide.colors.gray5(),
    boxShadow: 'none',
  },
  indicatorSeparator: {
    color: 'transparent',
  },
  inputText: {
    color: styleguide.colors.white,
    fontFamily: typography.fontFamily,
    paddingLeft: 7,
    cursor: 'default',
  },
  menu: {
    borderRadius: 4,
    padding: 0,
    border: `1px solid ${styleguide.colors.gray9()}`,
    backgroundColor: styleguide.colors.gray3(),
  },
  menuList: {
    padding: 0,
    fontFamily: typography.fontFamily,
  },
  valueContainer: {
    display: 'flex',
    flexWrap: 'nowrap' as 'nowrap',
    justifyContent: 'flex-start',
  },
  option: {
    cursor: 'pointer',
    padding: '8px 15px',
    fontFamily: typography.fontFamily,
    color: styleguide.colors.white,
    backgroundColor: styleguide.colors.gray3(),
  },
  optionSmall: {
    padding: '8px 4px',
    cursor: 'pointer',
    fontFamily: typography.fontFamily,
    color: styleguide.colors.white,
    backgroundColor: styleguide.colors.gray3(),
  },
  selectedOption: {
    backgroundColor: styleguide.colors.gray5(),
  },
  focusedOption: {
    backgroundColor: styleguide.colors.gray6(),
  },
  menuListSmall: {
    overflowY: 'unset' as 'unset',
    justifyItems: 'center',
  },
  valueContainerSmall: {
    padding: '0px',
    justifyContent: 'center',
  },
  singleValueSmall: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '42px',
    minHeight: '42px',
    cursor: 'pointer',
  },
};

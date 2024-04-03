import styles from './Slider.module.scss';

type Props = {
  defaultValue: number;
  minValue: number;
  maxValue: number;
  step: number;
  updateValue: (updated: number) => void;
};

export const Slider: React.FC<Props> = ({
  defaultValue,
  minValue,
  maxValue,
  step,
  updateValue,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.rangeSlider}>
        <input
          type="range"
          className={styles.range}
          defaultValue={defaultValue}
          step={step}
          min={minValue}
          max={maxValue}
          onChange={e => updateValue(parseFloat(e.target.value))}
        />
      </div>
    </div>
  );
};

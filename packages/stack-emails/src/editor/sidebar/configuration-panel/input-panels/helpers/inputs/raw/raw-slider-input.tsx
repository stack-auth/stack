import { Slider, Typography } from "@stackframe/stack-ui";

type SliderInputProps = {
  iconLabel: JSX.Element;
  step?: number;
  units: string;
  min?: number;
  max?: number;
  value: number;
  setValue: (v: number) => void;
};

export default function RawSliderInput({ iconLabel, value, setValue, units, ...props }: SliderInputProps) {
  return (
    <div className="flex w-full items-center justify-between space-x-2">
      <div className="min-w-[24px] shrink-0 leading-none">{iconLabel}</div>
      <Slider {...props} value={[value]} onValueChange={(value) => setValue(value[0])} className="flex-grow" />
      <div className="min-w-[32px] shrink-0 text-right">
        <Typography variant="secondary" type="label">
          {value + " " + units}
        </Typography>
      </div>
    </div>
  );
}

import React from 'react';
import { Slider } from '@/components/ui/slider'; // Assuming ShadCN has a Slider component
import Typography from '@/components/ui/typography';

type SliderInputProps = {
  iconLabel: JSX.Element,
  step?: number,
  units: string,
  min?: number,
  max?: number,
  value: number,
  setValue: (v: number) => void,
};

export default function RawSliderInput({ iconLabel, value, setValue, units, ...props }: SliderInputProps) {
  return (
    <div className="flex items-center space-x-2 justify-between w-full">
      <div className="min-w-[24px] leading-none shrink-0">{iconLabel}</div>
      <Slider
        {...props}
        value={[value]}
        onValueChange={(value) => setValue(value[0])}
        className="flex-grow"
      />
      <div className="min-w-[32px] text-right shrink-0">
        <Typography variant='secondary' type='label'>
          {value + ' ' + units}
        </Typography>
      </div>
    </div>
  );
}

import { useState } from 'react';
import RawSliderInput from './raw/raw-slider-input';
import { Label } from '@/components/ui/label';
import { AlignEndHorizontal, AlignEndVertical, AlignStartHorizontal, AlignStartVertical, ArrowDownFromLine, ArrowLeftFromLine, ArrowRightFromLine, ArrowUpFromLine } from 'lucide-react';

type TPaddingValue = {
  top: number,
  bottom: number,
  right: number,
  left: number,
};
type Props = {
  label: string,
  defaultValue: TPaddingValue | null,
  onChange: (value: TPaddingValue) => void,
};
export default function PaddingInput({ label, defaultValue, onChange }: Props) {
  const [value, setValue] = useState(() => {
    if (defaultValue) {
      return defaultValue;
    }
    return {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    };
  });

  function handleChange(internalName: keyof TPaddingValue, nValue: number) {
    const v = {
      ...value,
      [internalName]: nValue,
    };
    setValue(v);
    onChange(v);
  }

  return (
    <div className='flex flex-col gap-2'>
      <Label>{label}</Label>

      <RawSliderInput
        iconLabel={<ArrowUpFromLine className='w-4 h-4' />}
        value={value.top}
        setValue={(num) => handleChange('top', num)}
        units="px"
        step={4}
        min={0}
        max={80}
      />

      <RawSliderInput
        iconLabel={<ArrowDownFromLine className='w-4 h-4' />}
        value={value.bottom}
        setValue={(num) => handleChange('bottom', num)}
        units="px"
        step={4}
        min={0}
        max={80}
      />

      <RawSliderInput
        iconLabel={<ArrowLeftFromLine className='w-4 h-4' />}
        value={value.left}
        setValue={(num) => handleChange('left', num)}
        units="px"
        step={4}
        min={0}
        max={80}
      />

      <RawSliderInput
        iconLabel={<ArrowRightFromLine className='w-4 h-4' />}
        value={value.right}
        setValue={(num) => handleChange('right', num)}
        units="px"
        step={4}
        min={0}
        max={80}
      />
    </div>
  );
}

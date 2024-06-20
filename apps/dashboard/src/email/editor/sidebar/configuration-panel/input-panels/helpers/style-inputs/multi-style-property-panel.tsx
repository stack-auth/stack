import React from 'react';

import { TStyle } from '../../../../../documents/blocks/helpers/t-style';

import SingleStylePropertyPanel from './single-style-property-panel';

type MultiStylePropertyPanelProps = {
  names: (keyof TStyle)[],
  value: TStyle | undefined | null,
  onChange: (style: TStyle) => void,
};
export default function MultiStylePropertyPanel({ names, value, onChange }: MultiStylePropertyPanelProps) {
  return (
    <>
      {names.map((name) => (
        <SingleStylePropertyPanel key={name} name={name} value={value || {}} onChange={onChange} />
      ))}
    </>
  );
}

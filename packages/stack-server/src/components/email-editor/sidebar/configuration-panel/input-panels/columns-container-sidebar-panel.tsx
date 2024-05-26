import { useState } from 'react';
import {
  SpaceBarOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignCenterOutlined,
  VerticalAlignTopOutlined,
} from '@mui/icons-material';
import ColumnsContainerPropsSchema, { ColumnsContainerProps } from '../../../documents/blocks/columns-container/columns-container-props-schema';
import BaseSidebarPanel from './helpers/base-sidebar-panel';
import ColumnWidthsInput from './helpers/inputs/column-widths-input';
import SliderInput from './helpers/inputs/slider-input';
import MultiStylePropertyPanel from './helpers/style-inputs/multi-style-property-panel';
import { SingleToggleGroup } from './helpers/inputs/single-toggle-group';

type ColumnsContainerPanelProps = {
  data: ColumnsContainerProps,
  setData: (v: ColumnsContainerProps) => void,
};
export default function ColumnsContainerPanel({ data, setData }: ColumnsContainerPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);
  const updateData = (d: unknown) => {
    const res = ColumnsContainerPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  return (
    <BaseSidebarPanel title="Columns block">
      <SingleToggleGroup
        label="Number of columns"
        value={data.props?.columnsCount === 2 ? '2' : '3'}
        onValueChange={(v) => {
          updateData({ ...data, props: { ...data.props, columnsCount: v === '2' ? 2 : 3 } });
        }}
        items={[
          { value: '2', label: '2' },
          { value: '3', label: '3' },
        ]}
      />
      <ColumnWidthsInput
        defaultValue={data.props?.fixedWidths}
        onChange={(fixedWidths) => {
          updateData({ ...data, props: { ...data.props, fixedWidths } });
        }}
      />
      <SliderInput
        label="Columns gap"
        iconLabel={<SpaceBarOutlined sx={{ color: 'text.secondary' }} />}
        units="px"
        step={4}
        min={0}
        max={80}
        defaultValue={data.props?.columnsGap ?? 0}
        onChange={(columnsGap) => updateData({ ...data, props: { ...data.props, columnsGap } })}
      />
      <SingleToggleGroup
        label="Alignment"
        value={data.props?.contentAlignment ?? 'middle'}
        onValueChange={(contentAlignment) => {
          updateData({ ...data, props: { ...data.props, contentAlignment } });
        }}
        items={[
          { value: 'top', label: <VerticalAlignTopOutlined fontSize="small" /> },
          { value: 'middle', label: <VerticalAlignCenterOutlined fontSize="small" /> },
          { value: 'bottom', label: <VerticalAlignBottomOutlined fontSize="small" /> },
        ]}
      />

      <MultiStylePropertyPanel
        names={['backgroundColor', 'padding']}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </BaseSidebarPanel>
  );
}

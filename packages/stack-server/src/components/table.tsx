"use client";;
import * as React from 'react';
import { Sheet, Table as JoyTable } from '@mui/joy';

export default function Table(
  props: {
    headers: { name: string, width: number }[],
    rows: {
      id: string,
      row: {
        content: React.ReactNode,
      }[],
    }[],
  }) {
  return (
    <Sheet
      className="OrderTableContainer"
      variant="plain"
      sx={{
        display: 'initial',
        width: '100%',
        borderRadius: 'sm',
        flexShrink: 1,
        overflow: 'auto',
        minHeight: 0,
      }}
    >
      <JoyTable
        aria-labelledby="tableTitle"
        stickyHeader
        hoverRow
        sx={{
          '--TableCell-headBackground': 'var(--joy-palette-background-level1)',
          '--Table-headerUnderlineThickness': '1px',
          '--TableRow-hoverBackground': 'var(--joy-palette-background-level1)',
          '--TableCell-paddingY': '4px',
          '--TableCell-paddingX': '8px',
        }}
      >
        <thead>
          <tr>
            {props.headers.map(({ name, width }, idx)=> (
              <th key={idx} style={{ width, padding: '12px 6px', }}>{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map(({ id, row }) => (
            <tr key={id}>
                            
              {row.map(({ content }, idx) => (
                <td key={idx} style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {content}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </JoyTable>
    </Sheet>
  );
}
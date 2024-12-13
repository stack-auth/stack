import useResizeObserver from '@react-hook/resize-observer';
import { Card, CardContent, CardDescription, CardTitle } from '@stackframe/stack-ui';
import { RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';

import countries from './country-data.geo.json';

function useSize(target: RefObject<HTMLDivElement>) {
  const [size, setSize] = useState<DOMRectReadOnly>();

  useLayoutEffect(() => {
    if (!target.current) return;
    setSize(target.current.getBoundingClientRect());
  }, [target]);

  // Where the magic happens
  useResizeObserver(target, (entry) => setSize(entry.contentRect));
  return size;
}

export function GlobeSection({ countryData, children }: {countryData: Record<string, number>, children?: React.ReactNode}) {
  const globeRef = useRef<GlobeMethods>();
  const ref = useRef<HTMLDivElement>(null);
  const size = useSize(ref);

  const [selectedCountry, setSelectedCountry] = useState<{ code: string, name: string } | null>(null);

  const maxUserRatio = useMemo(
    () => {
      return Math.max(...countries.features.map(x =>
        (countryData[x.properties.ISO_A2] ?? 0) / (x.properties.POP_EST)
      ), 1);
    },
    [countryData]
  );

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ altitude: 1 });
    }
  }, [globeRef]);


  return <div className='flex w-full gap-4 flex-col xl:flex-row'>
    <div ref={ref} className='w-full xl:w-8/12 rounded-lg h-[300px] xl:h-[500px] border border-1 border-border overflow-hidden'>
      <Globe
        ref={globeRef}
        globeImageUrl='/static/globe_background.png'
        width={size?.width ?? 0}
        height={size?.height ?? 0}
        hexPolygonsData={countries.features}
        hexPolygonResolution={3}
        hexPolygonMargin={0.2}
        hexPolygonAltitude={0.02}
        hexPolygonColor={(d: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          const userRatio = (countryData[d.properties.ISO_A2] ?? 0) / d.properties.POP_EST;
          // 0 for smallest, 1 for biggest
          const clamped = userRatio / maxUserRatio;

          return `hsl(271, 84%, ${20 + 40 * clamped + 4}%)`;
        }}
        onHexPolygonHover={(d: any) => {
          if (d) {
            setSelectedCountry({ code: d.properties.ISO_A2, name: d.properties.NAME });
          }
        }}

        atmosphereColor='#CBD5E0'
        atmosphereAltitude={0.2}

        // ringsData={ringData}
        ringMaxRadius={3}
        ringRepeatPeriod={1000}
        ringColor={() => "#7CACFF"}
      />
    </div>
    <div className='h-full w-full xl:w-4/12 flex flex-col gap-4'>
      {children}
      {selectedCountry &&
        <Card>
          <CardContent>
            <CardTitle className='text-2xl'>{selectedCountry.name}</CardTitle>
            <CardDescription className='text-xl'>
              {countryData[selectedCountry.code] ?? 0} users
            </CardDescription>
          </CardContent>
        </Card>
      }
    </div>
  </div>;
}

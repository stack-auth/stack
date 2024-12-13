import useResizeObserver from '@react-hook/resize-observer';
import { Card, CardContent, CardDescription, CardTitle } from '@stackframe/stack-ui';
import { RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';

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

  const [countries, setCountries] = useState<any>({ features: [] });
  const [selectedCountry, setSelectedCountry] = useState<{ code: string, name: string } | null>(null);

  const maxCountryCount = Math.max(0, ...Object.values(countryData));

  useEffect(() => {
    let cancelled = false;
    
    runAsynchronously(async () => {
      const fetchRes = await fetch('/static/country-data.geojson');
      const json = fetchRes.json();
      if (!cancelled) setCountries(json);
    });
    
    return () => cancelled = true;
  }, []);

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
          const count = countryData[d.properties.ISO_A2];
          const clamped = count ? count / maxCountryCount : 0; // 0 for smallest, 1 for biggest

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
            <CardTitle className='text-2xl'>{selectedCountryName}</CardTitle>
            <CardDescription className='text-xl'>
              {countryData[selectedCountry] ?? 0} users
            </CardDescription>
          </CardContent>
        </Card>
      }
    </div>
  </div>;
}

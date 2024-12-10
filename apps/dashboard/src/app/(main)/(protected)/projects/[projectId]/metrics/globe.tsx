import useResizeObserver from '@react-hook/resize-observer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@stackframe/stack-ui';
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

const ringData = [
  { lat: 37.792080, lng: -122.432361 }
];


const PLACEHOLDER_COUNTRY_DATA: Record<string, number> = {
  'US': 123,
  'CA': 45,
  'JP': 67,
  'KR': 89,
};

export function GlobeSection({ countryData }: {countryData: Record<string, number>}) {
  const globeRef = useRef<GlobeMethods>();
  const ref = useRef<HTMLDivElement>(null);
  const size = useSize(ref);

  const [countries, setCountries] = useState<any>({ features: []});
  const [selectedCountry, setSelectedCountry] = useState<string|null>(null);
  const [selectedCountryName, setSelectedCountryName] = useState<string|null>(null);

  const maxCountryCount = Math.max(0, ...Object.values(countryData));

  useEffect(() => {
    // load data
    fetch('/static/country-data.geojson')
      .then(res => res.json())
      .then(setCountries)
      .catch(e => { throw e; });
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;
    globeRef.current.controls().minDistance = globeRef.current.getGlobeRadius();
    globeRef.current.controls().maxDistance = globeRef.current.getGlobeRadius() * 2;
  }, [globeRef]);

  return <div className='flex w-full gap-4'>
    <div ref={ref} className='w-8/12 rounded-md h-[500px]'>
      <Globe
        ref={globeRef}
        globeImageUrl='/static/globe_background.png'
        width={size?.width ?? 0}
        height={size?.height ?? 0}
        hexPolygonsData={countries.features}
        hexPolygonResolution={3}
        hexPolygonMargin={0.2}
        hexPolygonColor={(d: any) => {
          const count = countryData[d.properties.ISO_A2];
          const clamped = count ? count / maxCountryCount : 0; // 0 for smallest, 1 for biggest

          return `hsl(271, 84%, ${20 + 40 * clamped + 4}%)`;
          // return `hsl(271, 84%, ${20 + 40 * clamped + 5 * Math.random()}%)`;
          // return `hsl(271, 84%, ${64 + (5 - Math.random() * 10)}% / ${0.2 + clamped * 0.8})`;
          // return `hsl(271, 84%, ${64 + (5 - Math.random() * 10)}%)`;
        }}
        onHexPolygonHover={(d: any) => {
          if (d) {
            setSelectedCountry(d.properties.ISO_A2);
            setSelectedCountryName(d.properties.NAME);
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
    <div className='w-4/12'>
      {selectedCountry && <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>{selectedCountryName}</CardTitle>
          <CardDescription className='text-xl'>
            {countryData[selectedCountry] ?? 0} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* <p>Card Content</p> */}
        </CardContent>
      </Card>}
    </div>
  </div>;
}

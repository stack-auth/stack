import useResizeObserver from '@react-hook/resize-observer';
import { throwErr } from '@stackframe/stack-shared/dist/utils/errors';
import { Card, CardContent, CardDescription, CardTitle, Skeleton } from '@stackframe/stack-ui';
import { RefObject, use, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';

const countriesPromise = import('./country-data.geo.json');

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
  const countries = use(countriesPromise);
  const globeRef = useRef<GlobeMethods>();
  const ref = useRef<HTMLDivElement>(null);
  const size = useSize(ref);

  const [hexSelectedCountry, setHexSelectedCountry] = useState<{ code: string, name: string } | null>(null);
  const [polygonSelectedCountry, setPolygonSelectedCountry] = useState<{ code: string, name: string } | null>(null);
  const selectedCountry = hexSelectedCountry ?? polygonSelectedCountry ?? null;

  const [isGlobeReady, setIsGlobeReady] = useState(false);

  const [isLightMode, setIsLightMode] = useState<boolean | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const updateIsLightMode = () => {
      const shouldBeLight = getComputedStyle(document.documentElement).getPropertyValue('color-scheme') === 'light';
      if (shouldBeLight !== isLightMode) {
        setIsLightMode(shouldBeLight);
      }
    };
    updateIsLightMode();
    const interval = setInterval(updateIsLightMode, 1000);
    return () => clearInterval(interval);
  }, [isLightMode]);

  // calculate color values for each country
  const totalUsers = Object.values(countryData).reduce((acc, curr) => acc + curr, 0);
  const totalPopulation = countries.features.reduce((acc, curr) => acc + curr.properties.POP_EST, 0);
  const colorValues = new Map(countries.features.map((country) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const countryUsers = countryData[country.properties.ISO_A2_EH] ?? 0;
    const countryPopulation = country.properties.POP_EST;
    if (countryUsers === 0) return [country.properties.ISO_A2_EH, null] as const;

    // we want to get the lowest proportion such that there's a 95% chance that it's higher than the actual
    // proportion (given enough samples)
    // my math sucks, someone please correct me if I'm wrong (but the colors look nice)
    const observedProportion = countryUsers / totalUsers;
    const standardError = Math.sqrt(observedProportion * (1 - observedProportion) / totalUsers);
    const zScore = 1.645; // one-sided 95% confidence interval

    const proportionLowerBound = Math.max(0, observedProportion - zScore * standardError);  // how likely is it that a random user is in this country? (with 95% confidence lower bound from above)
    const populationProportion = countryPopulation / totalPopulation;  // how likely is it that a random person is in this country?
    const likelihoodRatio = proportionLowerBound / populationProportion;  // how much more likely is it for a random user to be in this country than a random person?

    const colorValue = Math.log(Math.max(1, 100 * likelihoodRatio));

    return [country.properties.ISO_A2_EH, colorValue] as const;
  }));
  const maxColorValue = Math.max(0, ...[...colorValues.values()].filter((v): v is number => v !== null));


  return <div className='flex w-full gap-4 flex-col xl:flex-row'>
    <div ref={ref} className='relative w-full xl:w-8/12 rounded-lg h-[300px] xl:h-[500px] border border-1 border-border overflow-hidden'>
      {!isGlobeReady && (
        <Skeleton style={{
          width: Math.min(size?.width ?? 0, size?.height ?? 0) * 1.9 / 3,
          height: Math.min(size?.width ?? 0, size?.height ?? 0) * 1.9 / 3,
          borderRadius: '100%',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }} />
      )}
      {isLightMode !== null && <Globe
        key={isLightMode ? 'light' : 'dark'}
        ref={globeRef}
        backgroundColor='#00000000'
        globeImageUrl={
          isLightMode
            ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAAD5Ip3+AAAADUlEQVQIHWO48vjffwAI+QO1AqIWWgAAAABJRU5ErkJggg=='
            : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAAD5Ip3+AAAADUlEQVQIHWPgF9f8DwAB1wFPLWQXmAAAAABJRU5ErkJggg=='
        }
        width={size?.width ?? 0}
        height={size?.height ?? 0}
        onGlobeReady={() => {
          setTimeout(() => setIsGlobeReady(true), 100);
          const current = globeRef.current ?? throwErr('Globe ref not available even though globe is ready?');
          const controls = current.controls();
          controls.maxDistance = 1000;
          controls.minDistance = 120;
          controls.dampingFactor = 0.3;
          console.log('controls', controls);
        }}
        animateIn={false}

        polygonsData={countries.features}
        polygonCapColor={() => "transparent"}
        polygonSideColor={() => "transparent"}
        polygonAltitude={0.002}
        onPolygonHover={(d: any) => {
          if (d) {
            setPolygonSelectedCountry({ code: d.properties.ISO_A2_EH, name: d.properties.NAME });
          } else {
            setPolygonSelectedCountry(null);
          }
        }}

        hexPolygonsData={countries.features}
        hexPolygonResolution={3}
        hexPolygonMargin={0.2}
        hexPolygonAltitude={0.003}
        hexPolygonColor={(country: any) => {
          const createColor = (value: number | null) => {
            // Chrome's WebGL is pretty fast so we can afford to do on-hover highlights
            const highlight = "chrome" in window && country.properties.ISO_A2_EH === selectedCountry?.code;

            if (Number.isNaN(value) || value === null || maxColorValue < 0.0001) {
              if (isLightMode) {
                return `hsl(210, 17.20%, ${highlight ? '55.5%' : '45.5%'})`;
              } else {
                if (value === null && maxColorValue < 0.0001) {
                  // if there are no users at all, in dark mode, show the globe in a slightly lighter color
                  return `hsl(271, 84%, ${highlight ? '30%' : '20%'})`;
                } else {
                  return `hsl(271, 84%, ${highlight ? '25%' : '15%'})`;
                }
              }
            }
            const scaled = value / maxColorValue;
            if (isLightMode) {
              return `hsl(${175 * (1 - scaled)}, 100%, ${20 + 70 * scaled + (highlight ? 10 : 0)}%)`;
            } else {
              return `hsl(271, 84%, ${24 + 40 * scaled + (highlight ? 10 : 0)}%)`;
            }
          };
          const color = createColor(colorValues.get(country.properties.ISO_A2_EH) ?? null);
          return color;
        }}
        onHexPolygonHover={(d: any) => {
          if (d) {
            setHexSelectedCountry({ code: d.properties.ISO_A2_EH, name: d.properties.NAME });
          } else {
            setHexSelectedCountry(null);
          }
        }}

        atmosphereColor='#CBD5E0'
        atmosphereAltitude={0.2}
      />}
      <div className='absolute top-1 left-2 text-red-500 flex items-center gap-2 text-xs font-bold pointer-events-none select-none'>
        <div className="stack-live-pulse"></div>
        <style>{`
          .stack-live-pulse {
            width: 6px;
            aspect-ratio: 1;
            border-radius: 50%;
            background: currentColor;
            box-shadow: 0 0 0 0 currentColor;
            animation: stack-live-pulse-anim 4s infinite;
          }
          @keyframes stack-live-pulse-anim {
              25% {box-shadow: 0 0 0 8px #0000}
              100% {box-shadow: 0 0 0 8px #0000}
          }
        `}</style>
        LIVE
      </div>
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

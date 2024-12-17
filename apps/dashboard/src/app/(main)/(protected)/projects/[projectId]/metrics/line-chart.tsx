import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@stackframe/stack-ui";
import { Area, AreaChart, Pie, PieChart, XAxis } from "recharts";

export type LineChartDisplayConfig = {
  name: string,
  description?: string,
  chart: ChartConfig,
}

export type DataPoint = {
  date: string,
  activity: number,
}

export function LineChartDisplay({
  config, datapoints
}: {
  config: LineChartDisplayConfig,
  datapoints: DataPoint[],
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {config.name}
        </CardTitle>
        <CardDescription>
          {config.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config.chart} className='w-full max-h-[300px] p-4'>
          <AreaChart accessibilityLayer data={datapoints}>
            <ChartTooltip
              content={<ChartTooltipContent labelKey='date'/>}
            />
            <Area
              dataKey="activity"
              fill="var(--color-activity)"
              fillOpacity={0.4}
              stroke="var(--color-activity)"
              strokeWidth={2}
            />

            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const BRAND_CONFIG = {
  email: {
    label: 'Email',
    color: '#ffffff'
  },
  magiclink: {
    label: 'Magic Link',
    color: '#A657F0'
  },
  passkey: {
    label: 'Passkey',
    color: '#D2B6EF'
  },
  google: {
    label: 'Google',
    color: '#4285F4',
  },
  github: {
    label: 'GitHub',
    color: '#238636',
  },
  microsoft: {
    label: 'Microsoft',
    color: '#F35325',
  },
  spotify: {
    label: 'Spotify',
    color: '#1ED760'
  },
  facebook: {
    label: 'Facebook',
    color: '#0866FF',
  },
  discord: {
    label: 'Discord',
    color: '#5865F2',
  },
  gitlab: {
    label: 'GitLab',
    color: '#FC6D26'
  },
  bitbucket: {
    label: 'Bitbucket',
    color: '#0052CC',
  },
  linkedin: {
    label: 'LinkedIn',
    color: '#0A66C2',
  },
  apple: {
    label: 'Apple',
    color: '#F47CAD',
  },
  x: {
    label: 'X (Twitter)',
    color: '#1D9BF0',
  }
};

export type AuthMethodDatapoint = {
  method: keyof typeof BRAND_CONFIG,
  count: number,
};

export function DonutChartDisplay({
  datapoints
}: {
  datapoints: AuthMethodDatapoint[],
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Login Methods
        </CardTitle>
        <CardDescription>
          Login methods used
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={BRAND_CONFIG} className='w-full max-h-[300px] p-4'>
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={datapoints.map(x => ({
                ...x,
                fill: `var(--color-${x.method})`
              }))}
              dataKey="count"
              nameKey="method"
              innerRadius={60}
              strokeWidth={5}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

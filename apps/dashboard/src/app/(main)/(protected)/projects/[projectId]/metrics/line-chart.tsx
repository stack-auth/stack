import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@stackframe/stack-ui";
import { Area, AreaChart, XAxis } from "recharts";

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
              type="step"
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

export function MiniLineChartDisplay({
  config, datapoints
}: {
  config: LineChartDisplayConfig,
  datapoints: DataPoint[],
}) {
  return (
    <Card className="max-w-[300px]">
      <CardHeader>
        <CardTitle className="text-3xl">
          {datapoints[datapoints.length - 1].activity}
        </CardTitle>
        <CardDescription className="text-lg">
          {config.name}
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
              type="step"
              fill="var(--color-activity)"
              fillOpacity={0.4}
              stroke="var(--color-activity)"
              strokeWidth={2}
            />
            {/*
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            /> */}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}


'use client';

import { Area, AreaChart, XAxis } from 'recharts';
import { PageLayout } from "../page-layout";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@stackframe/stack-ui';

const chartConfig = {
  activity: {
    label: "Activity",
    color: "#2563eb",
  },

} satisfies ChartConfig;

const chartData = [
  { date: "Dec 01", activity: 186, },
  { date: "Dec 02", activity: 205, },
  { date: "Dec 03", activity: 237, },
  { date: "Dec 04", activity: 303, },
  { date: "Dec 05", activity: 309, },
  { date: "Dec 06", activity: 314, },
  { date: "Dec 07", activity: 314, },
  { date: "Dec 08", activity: 314, },
  { date: "Dec 09", activity: 314, },
  { date: "Dec 10", activity: 186, },
  { date: "Dec 11", activity: 186, },
  { date: "Dec 12", activity: 205, },
  { date: "Dec 13", activity: 237, },
  { date: "Dec 14", activity: 303, },
  { date: "Dec 15", activity: 309, },
  { date: "Dec 16", activity: 314, },
  { date: "Dec 17", activity: 314, },
  { date: "Dec 18", activity: 314, },
  { date: "Dec 19", activity: 314, },
  { date: "Dec 20", activity: 186, },
  { date: "Dec 21", activity: 186, },
  { date: "Dec 22", activity: 205, },
  { date: "Dec 23", activity: 237, },
  { date: "Dec 24", activity: 303, },
  { date: "Dec 25", activity: 309, },
  { date: "Dec 26", activity: 314, },
  { date: "Dec 27", activity: 314, },
  { date: "Dec 28", activity: 314, },
  { date: "Dec 29", activity: 314, },
];

interface LineChartDisplayConfig {
  name: string,
  description: string,
  chart: ChartConfig,
}

function LineChartDisplay({
  config
}: {
  config: LineChartDisplayConfig,
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
          <AreaChart accessibilityLayer data={chartData}>
            <ChartTooltip
              content={<ChartTooltipContent labelKey='date'/>}
            />
            <Area
              dataKey="activity"
              type="natural"
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

const totalUsersConfig = {
  name: 'Total Users',
  description: 'Total number of users across the service',
  chart: {
    activity: {
      label: "Activity",
      color: "#cc6ce7",
    },
  }
} satisfies LineChartDisplayConfig;

const dauConfig = {
  name: 'Daily Active Users',
  description: 'Daily unique user login, over the last 30 days',
  chart: {
    activity: {
      label: "Activity",
      color: "#2563eb",
    },
  }
} satisfies LineChartDisplayConfig;

export default function PageClient() {
  return (
    <PageLayout title="User Metric Dashboard">
      <h2>Key Metrics</h2>
      <LineChartDisplay config={totalUsersConfig} />
      <LineChartDisplay config={dauConfig} />
      <h2>Demographic Breakdown</h2>

    </PageLayout>
  );
}

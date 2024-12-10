'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@stackframe/stack-ui';
import { useEffect, useState } from 'react';
import { Area, AreaChart, XAxis } from 'recharts';
import { PageLayout } from "../page-layout";
import { useAdminApp } from '../use-admin-app';


type LineChartDisplayConfig = {
  name: string,
  description: string,
  chart: ChartConfig,
}

type DataPoint = {
  date: string,
  activity: number,
}

function LineChartDisplay({
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
  const [data, setData] = useState<any>(null);
  const adminApp = useAdminApp();

  // TODO HACK: use Suspense for this instead
  useEffect(() => {
    adminApp.sendAdminRequest("/internal/metrics", {
      method: "GET",
    })
      .then((x: any) => x.json())
      .then((x: any)=> setData(x));
  }, [adminApp]);


  return (
    <PageLayout title="User Metric Dashboard">
      {
        data !== null && <>
          <h2>Key Metrics</h2>
          <LineChartDisplay
            config={totalUsersConfig}
            datapoints={data.total_users}
          />
          <LineChartDisplay
            config={dauConfig}
            datapoints={data.daily_active_users}
          />
        </>
      }
    </PageLayout>
  );
}

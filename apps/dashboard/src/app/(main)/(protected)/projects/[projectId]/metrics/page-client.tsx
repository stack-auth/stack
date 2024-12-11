'use client';

import { useEffect, useState } from 'react';
import { PageLayout } from "../page-layout";
import { useAdminApp } from '../use-admin-app';
import { GlobeSection } from './globe';
import { LineChartDisplay, LineChartDisplayConfig } from './line-chart';


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
    (adminApp as any).sendAdminRequest("/internal/metrics", {
      method: "GET",
    })
      .then((x: any) => x.json())
      .then((x: any) => setData(x))
      .catch((err: any) => { throw err; });
  }, [adminApp]);


  return (
    <PageLayout title="User Metric Dashboard">
      {
        data !== null && <>
          <GlobeSection countryData={data.users_by_country} />
          <LineChartDisplay
            config={totalUsersConfig}
            datapoints={data.total_users}
          />
          <LineChartDisplay
            config={dauConfig}
            datapoints={data.daily_active_users}
          />

          {/* <MiniLineChartDisplay
            config={totalUsersConfig}
            datapoints={data.total_users}
          /> */}
        </>
      }
    </PageLayout>
  );
}

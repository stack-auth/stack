'use client';

import { useUser } from '@stackframe/stack';
import { fromNow } from '@stackframe/stack-shared/dist/utils/dates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@stackframe/stack-ui';
import { PageLayout } from "../page-layout";
import { useAdminApp } from '../use-admin-app';
import { GlobeSection } from './globe';
import { DonutChartDisplay, LineChartDisplay, LineChartDisplayConfig } from './line-chart';


const stackAppInternalsSymbol = Symbol.for("StackAuth--DO-NOT-USE-OR-YOU-WILL-BE-FIRED--StackAppInternals");

const dailySignUpsConfig = {
  name: 'Daily Signups',
  description: 'User registration over the last 30 days',
  chart: {
    activity: {
      label: "Activity",
      color: "#cc6ce7",
    },
  }
} satisfies LineChartDisplayConfig;

const dauConfig = {
  name: 'Daily Active Users',
  description: 'Number of unique users that were active over the last 30 days',
  chart: {
    activity: {
      label: "Activity",
      color: "#2563eb",
    },
  }
} satisfies LineChartDisplayConfig;

export default function PageClient() {
  const adminApp = useAdminApp();

  const data = (adminApp as any)[stackAppInternalsSymbol].useMetrics();
  const user = useUser({ or: "redirect" });
  const displayName = user.displayName ?? user.primaryEmail;

  return (
    <PageLayout title={`Welcome back${displayName ? `, ${displayName}!` : '!'}`}>
      {
        data !== null && <>
          <GlobeSection countryData={data.users_by_country}>
            <Card>
              <CardContent>
                <CardTitle className='text-2xl'>
                  {data.total_users}
                </CardTitle>
                <CardDescription className='text-xl'>Total Users</CardDescription>
              </CardContent>
              <CardContent>
                <CardTitle className='text-2xl'>
                  {data.daily_active_users[data.daily_active_users.length - 1].activity}
                </CardTitle>
                <CardDescription className='text-xl'>Active Users Today</CardDescription>
              </CardContent>
            </Card>
          </GlobeSection>
          <div className='grid gap-4 lg:grid-cols-2'>
            <LineChartDisplay
              config={dailySignUpsConfig}
              datapoints={data.daily_users}
            />
            <LineChartDisplay
              config={dauConfig}
              datapoints={data.daily_active_users}
            />
            <Card>
              <CardHeader>
                <CardTitle>Recent Sign Ups</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Registered at</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {
                data.recently_registered.map((user: any) => <TableRow key={user.id}>
                  <TableCell>{user.display_name}</TableCell>
                  <TableCell>{fromNow(new Date(user.created_at_millis))}</TableCell>
                </TableRow>)
                    }
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recently Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Last Active at</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {
                data.recently_active.map((user: any) => <TableRow key={user.id}>
                  <TableCell>{user.display_name}</TableCell>
                  <TableCell>{fromNow(new Date(user.updated_at_millis))}</TableCell>
                </TableRow>)
                    }
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <DonutChartDisplay
              datapoints={data.login_methods}
            />
          </div>
        </>
      }
    </PageLayout>
  );
}

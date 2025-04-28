'use client';

// import { TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
const chartData = [
  { juz: '30', siswa: 35 },
  { juz: '29', siswa: 20 },
  { juz: '28', siswa: 10 },
  { juz: '27', siswa: 10 },
  { juz: '26', siswa: 3 },
];

const chartConfig = {
  siswa: {
    label: 'Siswa',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export function Chart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Hafalan Siswa</CardTitle>
        <CardDescription>Tahun Ajaran 2024/2025</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="juz"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="siswa" fill="var(--color-siswa)" radius={8}>
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {/* <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div> */}
        <div className="leading-none text-muted-foreground">
          Chart hafalan siswa bimbingan
        </div>
      </CardFooter>
    </Card>
  );
}

'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { ChartFilters } from './ChartFilters';
import { TahfidzChart } from './TahfidzChart';
import { WafaChart } from './WafaChart';
import { TahsinAlquranChart } from './TahsinAlquranChart';
import { TodayTargets } from './TodayTargets';
import { StudentInfoCard } from './StudentInfoCard';

type Period = {
  value: string;
  label: string;
  academicYear: string;
  semester: string;
  groupInfo?: {
    id: string;
    name: string;
    className: string;
  } | null;
};

type FilterData = {
  periods: Period[];
  defaultPeriod: string;
  studentInfo: {
    id: string;
    name: string;
    nis: string;
    currentGroup: {
      id: string;
      name: string;
      className: string;
    } | null;
  };
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function Management() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');

  const { data: filterData, error: filterError } = useSWR<FilterData>(
    '/api/student/chart/filters',
    fetcher
  );

  useEffect(() => {
    if (filterData?.defaultPeriod && !selectedPeriod) {
      setSelectedPeriod(filterData.defaultPeriod);
    }
  }, [filterData?.defaultPeriod, selectedPeriod]);

  const handlePeriodChange = (newPeriod: string) => {
    console.log('Period changed from', selectedPeriod, 'to', newPeriod);
    setSelectedPeriod(newPeriod);
  };

  if (filterError) {
    console.error('Filter error:', filterError);
    return <div className="text-destructive">Error loading filters: {filterError.message}</div>;
  }

  if (!filterData) {
    return <div className="text-muted-foreground">Loading filters...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <StudentInfoCard />
        </div>
        <div className="flex-2">
          <TodayTargets />
        </div>
      </div>

      <ChartFilters
        periods={filterData.periods}
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
      />

      {selectedPeriod && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <TahfidzChart key={`tahfidz-${selectedPeriod}`} period={selectedPeriod} />
          <WafaChart key={`wafa-${selectedPeriod}`} period={selectedPeriod} />
          <TahsinAlquranChart key={`tahsin-${selectedPeriod}`} period={selectedPeriod} />
        </div>
      )}
    </div>
  );
}

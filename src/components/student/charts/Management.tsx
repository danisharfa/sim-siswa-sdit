'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Card, CardContent } from '@/components/ui/card';
import { ChartFilters } from './ChartFilters';
import { TahfidzChart } from './TahfidzChart';
import { WafaChart } from './WafaChart';
import { TahsinAlquranChart } from './TahsinAlquranChart';

type Period = {
  value: string;
  label: string;
  academicYear: string;
  semester: string;
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

type StudentPeriodInfo = {
  studentId: string;
  studentName: string;
  currentPeriod: string;
  currentGroup: {
    id: string;
    name: string;
    className: string;
  } | null;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function Management() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');

  const { data: filterData, error: filterError } = useSWR<FilterData>(
    '/api/student/chart/filters',
    fetcher
  );

  // Fetch student info for the selected period
  const { data: periodInfo } = useSWR<StudentPeriodInfo>(
    selectedPeriod ? `/api/student/chart/${selectedPeriod}/tahfidz` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0,
    }
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

  // Use period-specific group info if available, otherwise fall back to current group
  const displayGroupInfo = periodInfo?.currentGroup || filterData.studentInfo?.currentGroup;

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-end gap-4">
        <div className="w-72">
          <Card>
            <CardContent>
              <div className="space-y-2">
                {displayGroupInfo ? (
                  <>
                    <p className="text-sm text-muted-foreground">Kelompok:</p>
                    <p className="text-sm font-medium">{displayGroupInfo.name}</p>
                    <p className="text-sm text-muted-foreground">Kelas:</p>
                    <p className="text-sm font-medium">{displayGroupInfo.className}</p>
                    {/* {periodInfo && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Periode: {periodInfo.currentPeriod}
                      </p>
                    )} */}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Tidak ada kelompok untuk periode ini
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <ChartFilters
            periods={filterData.periods}
            groups={[]}
            selectedPeriod={selectedPeriod}
            selectedGroup=""
            onPeriodChange={handlePeriodChange}
            onGroupChange={() => {}}
          />
        </div>
      </div>

      {selectedPeriod && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <TahfidzChart
            key={`tahfidz-${selectedPeriod}`}
            academicYear=""
            semester=""
            groupId=""
            period={selectedPeriod}
          />
          <WafaChart
            key={`wafa-${selectedPeriod}`}
            academicYear=""
            semester=""
            groupId=""
            period={selectedPeriod}
          />
          <TahsinAlquranChart
            key={`tahsin-${selectedPeriod}`}
            academicYear=""
            semester=""
            groupId=""
            period={selectedPeriod}
          />
        </div>
      )}
    </div>
  );
}

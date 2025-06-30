'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FaUserGraduate } from 'react-icons/fa';
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

type GroupOption = {
  id: string;
  name: string;
  classroomName: string;
  academicYear: string;
  semester: string;
  period: string;
  label: string;
};

type FilterData = {
  periods: Period[];
  groups: GroupOption[];
  defaultPeriod: string;
};

type ChartData = {
  studentId: string;
  studentName: string;
}[];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function Management() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [totalStudents, setTotalStudents] = useState<number>(0);

  const { data: filterData, error: filterError } = useSWR<FilterData>(
    '/api/coordinator/chart/filters',
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
    setSelectedGroup('all');
  };

  const getChartProps = () => {
    if (!selectedPeriod) {
      return { academicYear: '', semester: '' };
    }
    const [academicYear, semester] = selectedPeriod.split('|');
    console.log('Chart props:', { academicYear, semester, selectedGroup });
    return { academicYear, semester };
  };

  const chartProps = getChartProps();

  const period = `${encodeURIComponent(chartProps.academicYear)}-${chartProps.semester}`;
  const group = selectedGroup || 'all';

  const { data: tahfidzData } = useSWR<ChartData>(
    `/api/coordinator/chart/${period}/${group}/tahfidz`,
    fetcher
  );

  useEffect(() => {
    if (tahfidzData && Array.isArray(tahfidzData)) {
      setTotalStudents(tahfidzData.length);
    } else {
      setTotalStudents(0);
    }
  }, [tahfidzData]);

  if (filterError) {
    console.error('Filter error:', filterError);
    return <div className="text-destructive">Error loading filters: {filterError.message}</div>;
  }

  if (!filterData) {
    return <div className="text-muted-foreground">Loading filters...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-end gap-4">
        <div className="w-72">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">Total Siswa Bimbingan</CardTitle>
              <FaUserGraduate className="w-10 h-10 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-4xl font-bold text-primary">{totalStudents}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <ChartFilters
            periods={filterData.periods}
            groups={filterData.groups}
            selectedPeriod={selectedPeriod}
            selectedGroup={selectedGroup}
            onPeriodChange={handlePeriodChange}
            onGroupChange={setSelectedGroup}
          />
        </div>
      </div>

      {selectedPeriod && (
        <div className="grid grid-cols-1 gap-6">
          <TahfidzChart
            key={`tahfidz-${selectedPeriod}-${selectedGroup}`}
            academicYear={chartProps.academicYear}
            semester={chartProps.semester}
            groupId={selectedGroup}
          />
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <WafaChart
                key={`wafa-${selectedPeriod}-${selectedGroup}`}
                academicYear={chartProps.academicYear}
                semester={chartProps.semester}
                groupId={selectedGroup}
              />
            </div>
            <div className="flex-2">
              <TahsinAlquranChart
                key={`tahsin-${selectedPeriod}-${selectedGroup}`}
                academicYear={chartProps.academicYear}
                semester={chartProps.semester}
                groupId={selectedGroup}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FaUserGraduate, FaUsers, FaChalkboard } from 'react-icons/fa';
import { ChartFilters } from './ChartFilters';
import { TahfidzChart } from './TahfidzChart';
import { WafaChart } from './WafaChart';
import { TahsinAlquranChart } from './TahsinAlquranChart';
import { CoordinatorInfoCard } from './CoordinatorInfoCard';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [totalGroups, setTotalGroups] = useState<number>(0);
  const [totalClasses, setTotalClasses] = useState<number>(0);

  const { data: filterData, error: filterError } = useSWR<FilterData>(
    '/api/coordinator/chart/filters',
    fetcher
  );

  useEffect(() => {
    if (filterData?.defaultPeriod && !selectedPeriod) {
      setSelectedPeriod(filterData.defaultPeriod);
    }
  }, [filterData?.defaultPeriod, selectedPeriod]);

  useEffect(() => {
    if (filterData?.groups && selectedPeriod) {
      const [academicYear, semester] = selectedPeriod.split('|');

      const groupsForPeriod = filterData.groups.filter(
        (group) => group.academicYear === academicYear && group.semester === semester
      );

      setTotalGroups(groupsForPeriod.length);

      const uniqueClasses = new Set(groupsForPeriod.map((group) => group.classroomName));
      setTotalClasses(uniqueClasses.size);
    } else {
      setTotalGroups(0);
      setTotalClasses(0);
    }
  }, [filterData?.groups, selectedPeriod]);

  const handlePeriodChange = (newPeriod: string) => {
    // console.log('Period changed from', selectedPeriod, 'to', newPeriod);
    setSelectedPeriod(newPeriod);
    setSelectedGroup('all');
  };

  const getChartProps = () => {
    if (!selectedPeriod) {
      return { academicYear: '', semester: '' };
    }
    const [academicYear, semester] = selectedPeriod.split('|');
    // console.log('Chart props:', { academicYear, semester, selectedGroup });
    return { academicYear, semester };
  };

  const chartProps = getChartProps();

  const period = `${encodeURIComponent(chartProps.academicYear)}-${chartProps.semester}`;
  const group = selectedGroup || 'all';

  const shouldFetchData = chartProps.academicYear && chartProps.semester;

  const { data: tahfidzData } = useSWR<ChartData>(
    shouldFetchData ? `/api/coordinator/chart/${period}/${group}/tahfidz` : null,
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
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <CoordinatorInfoCard />
        </div>
        <div className="flex-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Siswa
                </CardTitle>
                <FaUserGraduate className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{totalStudents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Kelas
                </CardTitle>
                <FaChalkboard className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{totalClasses}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Kelompok
                </CardTitle>
                <FaUsers className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{totalGroups}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ChartFilters
        periods={filterData.periods}
        groups={filterData.groups}
        selectedPeriod={selectedPeriod}
        selectedGroup={selectedGroup}
        onPeriodChange={handlePeriodChange}
        onGroupChange={setSelectedGroup}
      />

      {selectedPeriod && (
        <div className="grid grid-cols-1 gap-4">
          <TahfidzChart
            key={`tahfidz-${selectedPeriod}-${selectedGroup}`}
            academicYear={chartProps.academicYear}
            semester={chartProps.semester}
            groupId={selectedGroup}
          />
          <div className="flex flex-col xl:flex-row gap-4">
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

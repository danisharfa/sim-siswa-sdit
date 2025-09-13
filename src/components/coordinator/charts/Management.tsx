'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FaUserGraduate, FaUsers, FaChalkboard } from 'react-icons/fa';
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

  // Calculate total groups and classes from filter data
  useEffect(() => {
    if (filterData?.groups && selectedPeriod) {
      const [academicYear, semester] = selectedPeriod.split('|');

      // Filter groups for selected period
      const groupsForPeriod = filterData.groups.filter(
        (group) => group.academicYear === academicYear && group.semester === semester
      );

      setTotalGroups(groupsForPeriod.length);

      // Count unique classes for selected period
      const uniqueClasses = new Set(groupsForPeriod.map((group) => group.classroomName));
      setTotalClasses(uniqueClasses.size);
    } else {
      setTotalGroups(0);
      setTotalClasses(0);
    }
  }, [filterData?.groups, selectedPeriod]);

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
      <div className="flex flex-col gap-4">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
              <FaUserGraduate className="w-10 h-10 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{totalStudents}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
              <FaChalkboard className="w-10 h-10 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{totalClasses}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Kelompok</CardTitle>
              <FaUsers className="w-10 h-10 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{totalGroups}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex justify-end">
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

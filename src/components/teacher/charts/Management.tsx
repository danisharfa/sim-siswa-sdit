'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FaUserGraduate, FaUsers } from 'react-icons/fa';
import { ChartFilters } from './ChartFilters';
import { TahfidzChart } from './TahfidzChart';
import { WafaChart } from './WafaChart';
import { TahsinAlquranChart } from './TahsinAlquranChart';
import { TeacherInfoCard } from './TeacherInfoCard';

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

  const { data: filterData, error: filterError } = useSWR<FilterData>(
    '/api/teacher/chart/filters',
    fetcher
  );

  useEffect(() => {
    if (filterData?.defaultPeriod && !selectedPeriod) {
      setSelectedPeriod(filterData.defaultPeriod);
    }
  }, [filterData?.defaultPeriod, selectedPeriod]);

  // Calculate total groups for teacher
  useEffect(() => {
    if (filterData?.groups && selectedPeriod) {
      const [academicYear, semester] = selectedPeriod.split('|');

      // Filter groups for selected period (teacher only sees their own groups)
      const groupsForPeriod = filterData.groups.filter(
        (group) => group.academicYear === academicYear && group.semester === semester
      );

      setTotalGroups(groupsForPeriod.length);
    } else {
      setTotalGroups(0);
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
    `/api/teacher/chart/${period}/${group}/tahfidz`,
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
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <TeacherInfoCard />
        </div>
        <div className="flex-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Siswa Bimbingan
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
                  Total Kelompok Bimbingan
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

'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

type ChartFiltersProps = {
  periods: Period[];
  groups: GroupOption[];
  selectedPeriod: string;
  selectedGroup: string;
  onPeriodChange: (value: string) => void;
  onGroupChange: (value: string) => void;
};

export function ChartFilters({
  periods,
  groups,
  selectedPeriod,
  selectedGroup,
  onPeriodChange,
  onGroupChange,
}: ChartFiltersProps) {
  const filteredGroups = groups.filter((group) => group.period === selectedPeriod);

  return (
    <div className="flex flex-wrap gap-4">
      <div>
        <Label className="mb-2 block">Filter Tahun Ajaran</Label>
        <Select value={selectedPeriod} onValueChange={onPeriodChange}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih periode" />
          </SelectTrigger>
          <SelectContent>
            {periods.map((period) => (
              <SelectItem key={period.value} value={period.value}>
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block">Filter Kelompok</Label>
        <Select value={selectedGroup} onValueChange={onGroupChange}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih kelompok" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelompok</SelectItem>
            {filteredGroups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

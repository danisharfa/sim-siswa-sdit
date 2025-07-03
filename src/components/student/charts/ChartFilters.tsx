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
  groupInfo?: {
    id: string;
    name: string;
    className: string;
  } | null;
};

type ChartFiltersProps = {
  periods: Period[];
  selectedPeriod: string;
  onPeriodChange: (value: string) => void;
};

export function ChartFilters({ periods, selectedPeriod, onPeriodChange }: ChartFiltersProps) {
  return (
    <>
      <Label className="mb-2 block">Filter Periode</Label>
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
    </>
  );
}

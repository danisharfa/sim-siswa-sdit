'use client';

import * as React from 'react';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { type DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Props {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function Calendar23({
  value,
  onChange,
  label = 'Tanggal Target',
  placeholder = 'Pilih rentang tanggal',
  className,
}: Props) {
  // Gunakan value dari props sebagai state internal
  const currentRange = value;

  const handleSelect = (selectedRange: DateRange | undefined) => {
    // Panggil onChange untuk update state parent
    onChange?.(selectedRange);
  };

  return (
    <div className={`flex flex-col gap-3 ${className || ''}`}>
      <Label htmlFor="dates" className="px-1">
        {label}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" id="dates" className="w-100 justify-between font-normal">
            <div className="flex items-center gap-2">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {currentRange?.from && currentRange?.to
                ? `${currentRange.from.toLocaleDateString(
                    'id-ID'
                  )} - ${currentRange.to.toLocaleDateString('id-ID')}`
                : placeholder}
            </div>
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="range"
            selected={currentRange}
            captionLayout="dropdown"
            onSelect={handleSelect}
            startMonth={new Date(1900, 0)}
            endMonth={new Date(2030, 11)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

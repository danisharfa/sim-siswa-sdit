'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerSimpleProps {
  value?: Date;
  onChange?: (date: Date) => void; // hanya menerima Date, bukan Date | undefined
  className?: string;
}

export function DatePickerSimple({ value, onChange, className }: DatePickerSimpleProps) {
  const [date, setDate] = React.useState<Date>(value || new Date());

  React.useEffect(() => {
    if (value) setDate(value);
  }, [value]);

  const handleSelect = (selected: Date | undefined) => {
    if (selected) {
      setDate(selected);
      onChange?.(selected); // hanya panggil onChange jika date tidak undefined
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-[240px] justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={handleSelect} autoFocus />
      </PopoverContent>
    </Popover>
  );
}

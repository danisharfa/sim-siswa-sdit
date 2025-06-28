'use client';

import * as React from 'react';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Props {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function Calendar01({
  value,
  onChange,
  label = 'Tanggal',
  placeholder = 'Pilih tanggal',
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={`flex flex-col gap-3 ${className || ''}`}>
      <Label htmlFor="date" className="px-1">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" id="date" className="w-100 justify-between font-normal">
            <div className="flex items-center gap-2">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? value.toLocaleDateString('id-ID') : placeholder}
            </div>
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            defaultMonth={value}
            selected={value}
            onSelect={(selectedDate) => {
              onChange?.(selectedDate);
              setOpen(false);
            }}
            className="rounded-lg border shadow-sm"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

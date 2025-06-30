'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export type ProgressItem = {
  id: string | number;
  name: string;
  completed: number;
  total: number;
  percent: number;
  status: 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI';
  subtitle?: string;
};

type ProgressBarCardProps = {
  title: string;
  description: string;
  items: ProgressItem[];
  isLoading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
};

export function ProgressBarCard({
  title,
  description,
  items,
  isLoading = false,
  error = null,
  emptyMessage = 'Tidak ada data',
}: ProgressBarCardProps) {
  const [dataFilter, setDataFilter] = useState<'all' | 'progress' | 'completed'>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SELESAI':
        return 'bg-green-500';
      case 'SEDANG_DIJALANI':
        return 'bg-blue-500';
      case 'BELUM_DIMULAI':
        return 'bg-gray-300';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SEDANG_DIJALANI':
        return 'Sedang Dijalani';
      case 'SELESAI':
        return 'Selesai';
      case 'BELUM_DIMULAI':
        return 'Belum Dimulai';
      default:
        return status;
    }
  };

  // Filter items based on selected filter
  const filteredItems = items.filter((item) => {
    switch (dataFilter) {
      case 'progress':
        return item.status === 'SEDANG_DIJALANI' || item.percent > 0;
      case 'completed':
        return item.status === 'SELESAI';
      case 'all':
      default:
        return true;
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Memuat data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Gagal memuat data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="flex gap-2 mt-4">
          <Button
            variant={dataFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDataFilter('all')}
            className="text-xs"
          >
            Semua Data
          </Button>
          <Button
            variant={dataFilter === 'progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDataFilter('progress')}
            className="text-xs"
          >
            Sedang Progress
          </Button>
          <Button
            variant={dataFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDataFilter('completed')}
            className="text-xs"
          >
            Selesai
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            {dataFilter === 'all'
              ? emptyMessage
              : `Tidak ada data ${
                  dataFilter === 'progress' ? 'yang sedang berprogress' : 'yang sudah selesai'
                }`}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.name}</span>
                    {item.subtitle && (
                      <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {item.completed}/{item.total}
                    </span>
                    <span className="font-medium">{item.percent}%</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs text-white ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                </div>
                <Progress value={item.percent} className="h-1.5" />
              </div>
            ))}
          </div>
        )}
        {items.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Menampilkan {filteredItems.length} dari {items.length} item
            {dataFilter !== 'all' &&
              ` (${dataFilter === 'progress' ? 'sedang berprogress' : 'sudah selesai'})`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

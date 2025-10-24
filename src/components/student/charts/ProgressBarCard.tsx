'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  items: ProgressItem[];
  isLoading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
};

export function ProgressBarCard({
  title,
  items,
  isLoading = false,
  error = null,
  emptyMessage = 'Tidak ada data',
}: ProgressBarCardProps) {
  const [dataFilter, setDataFilter] = useState<'all' | 'progress' | 'completed'>('all');

  const getProgressColors = (status: string, percent: number) => {
    switch (status) {
      case 'SELESAI':
        return {
          indicator: 'rgb(34 197 94)', // green-500
          background: 'rgb(34 197 94 / 0.2)', // green-500/20
          statusBg: 'bg-green-500'
        };
      case 'SEDANG_DIJALANI':
        return {
          indicator: 'rgb(59 130 246)', // blue-500
          background: 'rgb(59 130 246 / 0.2)', // blue-500/20
          statusBg: 'bg-blue-500'
        };
      case 'BELUM_DIMULAI':
        if (percent > 0) {
          // Jika ada progress meski status belum dimulai
          return {
            indicator: 'rgb(59 130 246)', // blue-500
            background: 'rgb(59 130 246 / 0.2)', // blue-500/20
            statusBg: 'bg-blue-500'
          };
        }
        return {
          indicator: 'rgb(209 213 219)', // gray-300
          background: 'rgb(209 213 219 / 0.2)', // gray-300/20
          statusBg: 'bg-gray-500'
        };
      default:
        return {
          indicator: 'rgb(209 213 219)', // gray-300
          background: 'rgb(209 213 219 / 0.2)', // gray-300/20
          statusBg: 'bg-gray-500'
        };
    }
  };

  // Hapus getProgressColor dan getStatusColor yang lama, ganti dengan:
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
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Gagal memuat data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle>{title}</CardTitle>
        <div className="flex flex-col gap-2 mt-3">
          <Button
            variant={dataFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDataFilter('all')}
          >
            Semua ({items.length})
          </Button>
          <Button
            variant={dataFilter === 'progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDataFilter('progress')}
          >
            Sedang Dijalani ({items.filter(i => i.status === 'SEDANG_DIJALANI' || i.percent > 0).length})
          </Button>
          <Button
            variant={dataFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDataFilter('completed')}
          >
            Selesai ({items.filter(i => i.status === 'SELESAI').length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 text-sm">
            {dataFilter === 'all'
              ? emptyMessage
              : `Tidak ada data ${
                  dataFilter === 'progress' ? 'yang sedang dijalani' : 'yang sudah selesai'
                }`}
          </p>
        ) : (
          <>
            {/* Scrollable content area */}
            <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3">
              {filteredItems.map((item) => {
                const colors = getProgressColors(item.status, item.percent);
                
                return (
                  <div key={item.id} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-medium truncate">{item.name}</span>
                        {item.subtitle && (
                          <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm ml-2">
                        <span className="text-muted-foreground whitespace-nowrap">
                          {item.completed}/{item.total}
                        </span>
                        <span className="font-medium whitespace-nowrap">{item.percent}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={item.percent} 
                        className="h-2 flex-1"
                        indicatorColor={colors.indicator}
                        backgroundColor={colors.background}
                      />
                      <span
                        className={`px-2 py-1 rounded-full text-xs text-white whitespace-nowrap ${colors.statusBg}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Summary footer */}
            <div className="mt-3 pt-3 border-t text-sm text-muted-foreground text-center">
              Menampilkan {filteredItems.length} dari {items.length} item
              {dataFilter !== 'all' &&
                ` (${dataFilter === 'progress' ? 'sedang dijalani' : 'sudah selesai'})`}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

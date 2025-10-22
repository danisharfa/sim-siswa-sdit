import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  onRetry?: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <h3 className="font-semibold text-lg">Terjadi Kesalahan</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Kami tidak dapat memuat data pengguna. Silakan periksa koneksi atau coba lagi nanti.
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Muat Ulang
        </Button>
      )}
    </div>
  );
}

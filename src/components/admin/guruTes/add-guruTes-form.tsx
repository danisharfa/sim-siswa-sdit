import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CirclePlus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  onUserAdded: () => void;
}

export function AddGuruTesForm({ onUserAdded }: Props) {
  const [nip, setNip] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAddGuruTes() {
    setLoading(true);

    try {
      const res = await fetch('/api/admin/guruTes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip }),
      });

      if (res.ok) {
        toast.success('Guru berhasil ditugaskan!');
        setNip('');
        onUserAdded();
      } else {
        const data = await res.json();
        toast.message(data.message || 'Gagal menugaskan guru');
      }
    } catch (error) {
      console.error('Error adding Guru Tes:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Tugaskan Guru</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Nip" value={nip} onChange={(e) => setNip(e.target.value)} />
        <Button onClick={handleAddGuruTes} disabled={loading || !nip}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Menambahkan...
            </>
          ) : (
            <>
              <CirclePlus />
              Menambahkan Guru
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

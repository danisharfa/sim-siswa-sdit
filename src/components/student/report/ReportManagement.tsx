import { use } from 'react';
import { fetchReportData } from '@/lib/data/student/report';
import { ReportTable } from '@/components/student/report/ReportTable';

export function ReportManagement() {
  const report = use(fetchReportData());

  return (
    <div className="p-4 space-y-4">
      <ReportTable data={report} title="Rapor"/>
    </div>
  );
}

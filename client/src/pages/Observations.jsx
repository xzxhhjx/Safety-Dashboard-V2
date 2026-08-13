import { useState, useCallback } from 'react';
import Toolbar from '../components/layout/Toolbar';
import FilterBar from '../components/FilterBar';
import DataTable from '../components/DataTable';
import { useObservations } from '../hooks/useObservations';
import { useLanguage } from '../context/LanguageContext';
import { Download } from 'lucide-react';

export default function Observations() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const { observations, total, loading } = useObservations(page, pageSize, filters);

  const handleExport = useCallback(() => {
    if (!observations?.length) return;
    const headers = ['ID', 'Hazard', 'Status', 'Area', 'Dept', 'Description', 'Submitter', 'Date', 'AI Category'];
    const rows = observations.map(r => [
      r.id, r.hazard || '', r.status || '', r.area || '', r.dept || '',
      `"${(r.description || '').replace(/"/g, '""')}"`,
      r.submitter || '', r.obs_time || '',
      r.ai_category_cn || r.ai_category || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safety-observations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [observations]);

  return (
    <div>
      <Toolbar
        title={t('observations.title')}
        subtitle={t('observations.subtitle')}
        filters={filters}
        onFilterChange={f => { setFilters(f); setPage(1); }}
        actions={
          <button onClick={handleExport} className="btn-secondary">
            <Download className="w-3.5 h-3.5" /> {t('common.exportCsv')}
          </button>
        }
      />

      <div className="px-6 py-6">
        {/* Advanced Filter Bar */}
        <div className="card mb-6" style={{ padding: '16px 20px' }}>
          <FilterBar filters={filters} onChange={f => { setFilters(f); setPage(1); }} />
        </div>

        {/* Data Table */}
        <div className="card">
          <DataTable
            data={observations}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            loading={loading}
            selectable
            onExport={handleExport}
          />
        </div>
      </div>
    </div>
  );
}

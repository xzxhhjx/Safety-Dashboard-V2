import { useState } from 'react';
import Toolbar from '../components/layout/Toolbar';
import SearchInput from '../components/ui/SearchInput';
import { useStats } from '../hooks/useStats';
import { useObservations } from '../hooks/useObservations';
import AreaChart from '../components/charts/AreaChart';
import TopRiskBars from '../components/charts/TopRiskBars';
import DataTable from '../components/DataTable';
import { MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function WorkAreas() {
  const { t } = useLanguage();
  const [areaSearch, setAreaSearch] = useState('');
  const [page, setPage] = useState(1);
  const filters = areaSearch ? { area: areaSearch } : {};
  const { stats, loading: statsLoading } = useStats(filters);
  const { observations, total, loading: obsLoading } = useObservations(page, 25, filters);

  return (
    <div>
      <Toolbar title={t('workAreas.title')} subtitle={t('workAreas.subtitle')} />

      <div className="px-6 py-6">
        {/* Search */}
        <div className="mb-6">
          <SearchInput value={areaSearch} onChange={setAreaSearch} placeholder={t('workAreas.searchPlaceholder')} />
        </div>

        {/* Area Risk Heat + Area Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h2 className="section-title">{t('workAreas.areaRiskDist')}</h2>
            <AreaChart data={stats?.areaDist} />
          </div>
          <div className="card">
            <h2 className="section-title">{t('workAreas.highRiskAreas')}</h2>
            {stats?.areaDist ? (
              <TopRiskBars data={stats.areaDist.slice(0, 10)} />
            ) : (
              <div className="chart-container flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>{t('common.noData')}</div>
            )}
          </div>
        </div>

        {/* Area Status Cards */}
        {stats?.areaDist?.slice(0, 6) && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-5">
            {stats.areaDist.slice(0, 6).map(area => (
              <div key={area.name} className="card text-center" style={{ padding: '16px' }}>
                <MapPin className="w-4 h-4 mx-auto mb-1.5" style={{ color: 'var(--system-blue)' }} />
                <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{area.name}</div>
                <div className="text-lg font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{area.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('workAreas.observations')}</div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Observations — filtered by area */}
        <div className="card">
          <h2 className="section-title">
            {areaSearch ? t('workAreas.observationsArea', { area: areaSearch }) : t('workAreas.recent')}
          </h2>
          <DataTable
            data={observations}
            total={total}
            page={page}
            pageSize={25}
            onPageChange={setPage}
            onPageSizeChange={() => {}}
            loading={obsLoading}
          />
        </div>
      </div>
    </div>
  );
}

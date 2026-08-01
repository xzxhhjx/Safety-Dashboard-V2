import { useState } from 'react';
import Toolbar from '../components/layout/Toolbar';
import SearchInput from '../components/ui/SearchInput';
import { useStats } from '../hooks/useStats';
import { useObservations } from '../hooks/useObservations';
import AreaChart from '../components/charts/AreaChart';
import TopRiskBars from '../components/charts/TopRiskBars';
import DataTable from '../components/DataTable';
import { MapPin } from 'lucide-react';

export default function WorkAreas() {
  const [areaSearch, setAreaSearch] = useState('');
  const [page, setPage] = useState(1);
  const filters = areaSearch ? { area: areaSearch } : {};
  const { stats, loading: statsLoading } = useStats(filters);
  const { observations, total, loading: obsLoading } = useObservations(page, 25, filters);

  return (
    <div>
      <Toolbar title="Work Areas" subtitle="Area-centric safety analysis" />

      <div className="px-6 py-5" style={{ maxWidth: 1440 }}>
        {/* Search */}
        <div className="mb-5">
          <SearchInput value={areaSearch} onChange={setAreaSearch} placeholder="Search work areas..." />
        </div>

        {/* Area Risk Heat + Area Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div className="card">
            <h2 className="section-title">Area Risk Distribution</h2>
            <AreaChart data={stats?.areaDist} />
          </div>
          <div className="card">
            <h2 className="section-title">High-Risk Work Areas</h2>
            {stats?.areaDist ? (
              <TopRiskBars data={stats.areaDist.slice(0, 10)} />
            ) : (
              <div className="chart-container flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>No data</div>
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
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>observations</div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Observations — filtered by area */}
        <div className="card">
          <h2 className="section-title">
            {areaSearch ? `Observations — ${areaSearch}` : 'Recent Area Observations'}
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

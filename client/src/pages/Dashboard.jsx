import { useState } from 'react';
import FilterBar from '../components/FilterBar';
import MetricCards from '../components/MetricCards';
import { useStats } from '../hooks/useStats';
import { useObservations } from '../hooks/useObservations';
import HazardChart from '../components/charts/HazardChart';
import AreaChart from '../components/charts/AreaChart';
import StatusPie from '../components/charts/StatusPie';
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart';
import TopRiskBars from '../components/charts/TopRiskBars';
import DeptRankingList from '../components/charts/DeptRankingList';
import SubmitterRankingList from '../components/charts/SubmitterRankingList';
import DataTable from '../components/DataTable';

export default function Dashboard() {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const { stats, loading: statsLoading } = useStats(filters);
  const { observations, total, loading: obsLoading } = useObservations(page, pageSize, filters);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Top Toolbar — macOS title bar style */}
      <div className="card flex flex-wrap items-center justify-between gap-4 mb-5"
        style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Safety Dashboard</h1>
        <FilterBar filters={filters} onChange={f => { setFilters(f); setPage(1); }} />
      </div>

      <div className="max-w-7xl mx-auto px-5 pb-10">
        {/* KPI Cards — 2×2 grid */}
        <MetricCards stats={stats} loading={statsLoading} />

        {/* Row: Risk Donut + Status Ring */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div className="card">
            <h2 className="section-title">Risk Categories</h2>
            <HazardChart data={stats?.hazardDist} />
          </div>
          <div className="card">
            <h2 className="section-title">Status Overview</h2>
            <StatusPie data={stats?.statusDist} closedRate={stats?.closedRate} />
          </div>
        </div>

        {/* Safety Trend — Full Width */}
        <div className="card mb-5">
          <h2 className="section-title">Safety Trend</h2>
          <MonthlyTrendChart data={stats?.monthlyTrend?.map(d => ({ name: d.month, value: d.count }))} />
        </div>

        {/* Row: Top Risk Categories + Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div className="card">
            <h2 className="section-title">Top Risk Categories</h2>
            <TopRiskBars data={stats?.hazardDist} />
          </div>
          <div className="card">
            <h2 className="section-title">Rankings</h2>
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Department Ranking</h3>
                <DeptRankingList data={stats?.deptRank} />
              </div>
              <div>
                <h3 className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Top Submitters</h3>
                <SubmitterRankingList data={stats?.submitterRank} />
              </div>
            </div>
          </div>
        </div>

        {/* Work Areas */}
        <div className="card mb-5">
          <h2 className="section-title">Work Areas</h2>
          <AreaChart data={stats?.areaDist} />
        </div>

        {/* Records Table */}
        <div className="card">
          <h2 className="section-title">Recent Safety Observations</h2>
          <DataTable
            data={observations}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            loading={obsLoading}
          />
        </div>
      </div>
    </div>
  );
}

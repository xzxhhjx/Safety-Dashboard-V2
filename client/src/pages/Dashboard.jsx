import { useState } from 'react';
import FilterBar from '../components/FilterBar';
import MetricCards from '../components/MetricCards';
import { useStats } from '../hooks/useStats';
import { useObservations } from '../hooks/useObservations';
import HazardChart from '../components/charts/HazardChart';
import AreaChart from '../components/charts/AreaChart';
import StatusPie from '../components/charts/StatusPie';
import DeptChart from '../components/charts/DeptChart';
import SubmitterChart from '../components/charts/SubmitterChart';
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart';
import WordCloud from '../components/charts/WordCloud';
import DataTable from '../components/DataTable';

export default function Dashboard() {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const { stats, loading: statsLoading } = useStats(filters);
  const { observations, total, loading: obsLoading } = useObservations(page, pageSize, filters);

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Safety Dashboard</h1>

      <FilterBar filters={filters} onChange={f => { setFilters(f); setPage(1); }} />
      <MetricCards stats={stats} loading={statsLoading} />

      {/* Row 2: Hazard Distribution (2/3) + Status Breakdown (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <HazardChart data={stats?.hazardDist} />
        </div>
        <div className="lg:col-span-1">
          <StatusPie data={stats?.statusDist} />
        </div>
      </div>

      {/* Row 3: Word Cloud (1/3) + Area Distribution (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-1">
          <WordCloud data={stats?.hazardDist} />
        </div>
        <div className="lg:col-span-2">
          <AreaChart data={stats?.areaDist} />
        </div>
      </div>

      {/* Row 4: Monthly Trend (full width) */}
      <div className="mb-4">
        <MonthlyTrendChart data={stats?.monthlyTrend?.map(d => ({ name: d.month, value: d.count }))} />
      </div>

      {/* Row 5: Department Ranking (1/2) + Top Submitters (1/2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <DeptChart data={stats?.deptRank} />
        <SubmitterChart data={stats?.submitterRank} />
      </div>

      {/* Table section */}
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
  );
}

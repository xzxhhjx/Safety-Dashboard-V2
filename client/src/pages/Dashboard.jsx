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
  const { stats, loading: statsLoading } = useStats(filters);
  const { observations, total, loading: obsLoading } = useObservations(page, filters);

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Safety Dashboard</h1>

      <FilterBar filters={filters} onChange={f => { setFilters(f); setPage(1); }} />
      <MetricCards stats={stats} loading={statsLoading} />

      {/* Chart section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <HazardChart data={stats?.hazardDist} />
        <AreaChart data={stats?.areaDist} />
        <StatusPie data={stats?.statusDist} />
        <DeptChart data={stats?.deptRank} />
        <SubmitterChart data={stats?.submitterRank} />
        <MonthlyTrendChart data={stats?.monthlyTrend?.map(d => ({ name: d.month, value: d.count }))} />
        <div className="md:col-span-2">
          <WordCloud data={stats?.hazardDist} />
        </div>
      </div>

      {/* Table section */}
      <DataTable
        data={observations}
        total={total}
        page={page}
        pageSize={50}
        onPageChange={setPage}
        loading={obsLoading}
      />
    </div>
  );
}

import { useState } from 'react';
import Toolbar from '../components/layout/Toolbar';
import TabBar from '../components/ui/TabBar';
import { useStats } from '../hooks/useStats';
import HeatmapChart from '../components/charts/HeatmapChart';
import TopRiskBars from '../components/charts/TopRiskBars';
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart';
import AreaChart from '../components/charts/AreaChart';
import DataTable from '../components/DataTable';
import { useObservations } from '../hooks/useObservations';

const TABS = [
  { key: 'risk',       label: 'Risk' },
  { key: 'trends',     label: 'Trends' },
  { key: 'areas',      label: 'Areas' },
  { key: 'people',     label: 'People' },
];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('risk');
  const [filters, setFilters] = useState({});
  const [drillDown, setDrillDown] = useState(null); // { area, hazard } from heatmap click
  const [drillPage, setDrillPage] = useState(1);
  const [drillPageSize, setDrillPageSize] = useState(10);
  const { stats, loading } = useStats(filters);
  const drillFilters = drillDown
    ? { ...filters, area: drillDown.area, ai_category: drillDown.hazard }
    : filters;
  const { observations, total, loading: drillLoading } = useObservations(drillPage, drillPageSize, drillFilters);

  const handleCellClick = (cell) => {
    setDrillDown(cell);
    setDrillPage(1);
  };

  return (
    <div>
      <Toolbar title="Analytics" subtitle="Deep-dive into safety data" filters={filters} onFilterChange={setFilters} />

      <div className="px-6 py-6">
        {/* Tab Bar */}
        <div className="mb-6">
          <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
        </div>

        {/* Risk Tab — Heatmap */}
        {activeTab === 'risk' && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="section-title" style={{ marginBottom: 4 }}>区域-隐患热力图</h2>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                    Heatmap Analysis (Areas vs Hazards) — click a cell to drill down
                  </p>
                </div>
                {drillDown && (
                  <button
                    className="btn-secondary"
                    onClick={() => { setDrillDown(null); setDrillPage(1); }}
                  >
                    Clear filter
                  </button>
                )}
              </div>
              <HeatmapChart data={stats?.heatmapRaw} onCellClick={handleCellClick} />
            </div>

            {/* Drill-down Table */}
            {drillDown && (
              <div className="card">
                <h2 className="section-title">
                  Records: {drillDown.area} — {drillDown.hazard}
                </h2>
                <DataTable
                  data={observations}
                  total={total}
                  page={drillPage}
                  pageSize={drillPageSize}
                  onPageChange={setDrillPage}
                  onPageSizeChange={(size) => { setDrillPageSize(size); setDrillPage(1); }}
                  loading={drillLoading}
                />
              </div>
            )}
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="section-title">Monthly Observation Trend</h2>
              <MonthlyTrendChart data={stats?.monthlyTrend?.map(d => ({ name: d.month, value: d.count }))} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="section-title">Week-over-Week Comparison</h2>
                <div className="chart-container flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
                  Weekly data available with date range filter
                </div>
              </div>
              <div className="card">
                <h2 className="section-title">Open vs Closed Trend</h2>
                <div className="chart-container flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
                  Breakdown available with status filter
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Areas Tab */}
        {activeTab === 'areas' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="section-title">Top 10 Work Areas</h2>
              <AreaChart data={stats?.areaDist} />
            </div>
            <div className="card">
              <h2 className="section-title">High-Risk Area Rankings</h2>
              <TopRiskBars data={stats?.areaDist?.slice(0, 10)} />
            </div>
          </div>
        )}

        {/* People Tab — Submitters + Departments side by side */}
        {activeTab === 'people' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="section-title">提交人</h2>
              <p className="text-xs text-slate-400" style={{ marginBottom: 8 }}>Submitters</p>
              <TopRiskBars data={stats?.submitterRank} />
            </div>
            <div className="card">
              <h2 className="section-title">提交人部门</h2>
              <p className="text-xs text-slate-400" style={{ marginBottom: 8 }}>Departments</p>
              <TopRiskBars data={stats?.deptRank} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

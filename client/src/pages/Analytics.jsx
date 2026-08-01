import { useState } from 'react';
import Toolbar from '../components/layout/Toolbar';
import TabBar from '../components/ui/TabBar';
import { useStats } from '../hooks/useStats';
import HazardChart from '../components/charts/HazardChart';
import TopRiskBars from '../components/charts/TopRiskBars';
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart';
import DeptChart from '../components/charts/DeptChart';
import SubmitterChart from '../components/charts/SubmitterChart';
import AreaChart from '../components/charts/AreaChart';

const TABS = [
  { key: 'risk',       label: 'Risk' },
  { key: 'trends',     label: 'Trends' },
  { key: 'areas',      label: 'Areas' },
  { key: 'departments', label: 'Departments' },
  { key: 'submitters', label: 'Submitters' },
];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('risk');
  const [filters] = useState({});
  const { stats, loading } = useStats(filters);

  return (
    <div>
      <Toolbar title="Analytics" subtitle="Deep-dive into safety data" />

      <div className="px-8 py-6" style={{ maxWidth: 1440 }}>
        {/* Tab Bar */}
        <div className="mb-6">
          <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
        </div>

        {/* Risk Tab */}
        {activeTab === 'risk' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="section-title">Risk Category Distribution</h2>
              <HazardChart data={stats?.hazardDist} />
            </div>
            <div className="card">
              <h2 className="section-title">Top Risk Categories</h2>
              <TopRiskBars data={stats?.hazardDist} />
            </div>
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

        {/* Departments Tab */}
        {activeTab === 'departments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="section-title">Observations by Department</h2>
              <DeptChart data={stats?.deptRank} />
            </div>
            <div className="card">
              <h2 className="section-title">Department Rankings</h2>
              <TopRiskBars data={stats?.deptRank} />
            </div>
          </div>
        )}

        {/* Submitters Tab */}
        {activeTab === 'submitters' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="section-title">Top Submitters</h2>
              <SubmitterChart data={stats?.submitterRank} />
            </div>
            <div className="card">
              <h2 className="section-title">Submitter Rankings</h2>
              <TopRiskBars data={stats?.submitterRank} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

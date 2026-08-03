import { useState } from 'react';
import Toolbar from '../components/layout/Toolbar';
import KPICards from '../components/cards/KPICards';
import { useStats } from '../hooks/useStats';
import { useObservations } from '../hooks/useObservations';
import StatusPie from '../components/charts/StatusPie';
import HazardChart from '../components/charts/HazardChart';
import TopRiskBars from '../components/charts/TopRiskBars';
import DataTable from '../components/DataTable';
import { LayoutList, CheckCircle2, AlertTriangle, MapPin } from 'lucide-react';

const iconCls = "w-5 h-5";

export default function Overview() {
  const [filters] = useState({});
  const { stats, loading: statsLoading } = useStats(filters);
  const { observations, total, loading: obsLoading } = useObservations(1, 5, {});

  const openCount = (stats?.totalCount || 0) -
    (stats?.totalCount && stats?.closedRate ? Math.round(stats.totalCount * stats.closedRate / 100) : 0);

  const kpiCards = [
    { label: 'Total Records', value: stats?.totalCount?.toLocaleString() || '0', color: '#007AFF', icon: <LayoutList className={iconCls} /> },
    { label: 'Open Observations', value: openCount.toLocaleString(), color: '#FF9F0A', icon: <AlertTriangle className={iconCls} /> },
    { label: 'Closed This Month', value: `${stats?.closedRate || 0}%`, color: '#34C759', icon: <CheckCircle2 className={iconCls} /> },
    { label: 'Active Work Areas', value: stats?.areaCount || 0, color: '#8E8E93', icon: <MapPin className={iconCls} /> },
  ];

  return (
    <div>
      <Toolbar title="Overview" subtitle="30-second safety status snapshot" />

      <div className="px-8 py-6" style={{ maxWidth: 1440 }}>
        {/* KPI Cards */}
        <KPICards cards={kpiCards} loading={statsLoading} />

        {/* Row: Hazard Distribution Ring + Status Ring */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h2 className="section-title">Hazard Distribution</h2>
            <HazardChart data={stats?.hazardDist} showAll={true} />
          </div>
          <div className="card">
            <h2 className="section-title">Status Overview</h2>
            <StatusPie data={stats?.statusDist} closedRate={stats?.closedRate} />
          </div>
        </div>

        {/* Top Risk Categories */}
        <div className="card mb-6">
          <h2 className="section-title">Top Risk Categories</h2>
          <TopRiskBars data={stats?.hazardDist} />
        </div>

        {/* Recent Observations — 5 rows only */}
        <div className="card">
          <h2 className="section-title">Recent Safety Observations</h2>
          <DataTable
            data={observations}
            total={total}
            page={1}
            pageSize={5}
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
            loading={obsLoading}
          />
        </div>
      </div>
    </div>
  );
}

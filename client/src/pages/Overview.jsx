import { useState, useCallback } from 'react';
import Toolbar from '../components/layout/Toolbar';
import KPICards from '../components/cards/KPICards';
import { useStats } from '../hooks/useStats';
import { useObservations } from '../hooks/useObservations';
import StatusPie from '../components/charts/StatusPie';
import HazardChart from '../components/charts/HazardChart';
import HazardList from '../components/charts/HazardList';
import TopRiskBars from '../components/charts/TopRiskBars';
import DataTable from '../components/DataTable';
import { LayoutList, CheckCircle2, AlertTriangle, MapPin } from 'lucide-react';

const iconCls = "w-5 h-5";

export default function Overview() {
  const [filters, setFilters] = useState({});
  const [hazardLimit, setHazardLimit] = useState('all');
  const [hazardCategories, setHazardCategories] = useState([]);
  const { stats, loading: statsLoading } = useStats(filters);
  const { observations, total, loading: obsLoading } = useObservations(1, 50, { ...filters, unclosed: 'true' });

  const handleHazardProcessed = useCallback((categories) => {
    setHazardCategories(categories);
  }, []);

  const openCount = (stats?.totalCount || 0) -
    (stats?.totalCount && stats?.closedRate ? Math.round(stats.totalCount * stats.closedRate / 100) : 0);

  const kpiCards = [
    { label: 'Total Records', value: stats?.totalCount?.toLocaleString() || '0', color: '#2563EB', icon: <LayoutList className={iconCls} /> },
    { label: 'Open Observations', value: openCount.toLocaleString(), color: '#D97706', icon: <AlertTriangle className={iconCls} /> },
    { label: 'Closed This Month', value: `${stats?.closedRate || 0}%`, color: '#059669', icon: <CheckCircle2 className={iconCls} /> },
    { label: 'Active Work Areas', value: stats?.areaCount || 0, color: '#64748B', icon: <MapPin className={iconCls} /> },
  ];

  return (
    <div>
      <Toolbar title="Overview" subtitle="30-second safety status snapshot" filters={filters} onFilterChange={setFilters} />

      <div className="px-6 py-6">
        {/* KPI Cards */}
        <KPICards cards={kpiCards} loading={statsLoading} />

        {/* Row: Hazard Distribution + Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Hazard Distribution — spans 2/3, matches old layout */}
          <div className="lg:col-span-2 card flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">隐患类型分布</h2>
              <div className="flex items-center gap-2 bg-slate-50/50 p-1 rounded-lg border border-slate-200/50">
                <span className="text-xs font-normal text-slate-500 pl-1">显示:</span>
                <select
                  value={hazardLimit}
                  onChange={e => setHazardLimit(e.target.value)}
                  className="text-xs bg-transparent text-slate-600 outline-none hover:text-indigo-600 cursor-pointer font-medium"
                >
                  <option value="5">Top 5</option>
                  <option value="10">Top 10</option>
                  <option value="all">全部</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4" style={{ minHeight: 420 }}>
              <HazardChart
                data={stats?.hazardDist}
                subData={stats?.hazardSubDist}
                limit={hazardLimit}
                onProcessed={handleHazardProcessed}
              />
              <div className="w-full md:w-5/12 overflow-y-auto border-l border-slate-200/50 pl-4"
                style={{ maxHeight: 420 }}>
                <HazardList categories={hazardCategories} />
              </div>
            </div>
          </div>

          {/* Status Overview — spans 1/3 */}
          <div className="lg:col-span-1 card flex flex-col">
            <h2 className="section-title">观察项状态</h2>
            <p className="text-xs text-slate-400" style={{ marginBottom: 8 }}>已关闭 / 未关闭</p>
            <StatusPie totalCount={stats?.totalCount} closedRate={stats?.closedRate} />
          </div>
        </div>

        {/* Weekly Top Submitters — last 7 days, top 5 */}
        <div className="card mb-6">
          <h2 className="section-title">本周提交最多</h2>
          {stats?.weeklySubmitterRank?.length > 0 ? (
            <TopRiskBars data={stats.weeklySubmitterRank} />
          ) : (
            <div className="flex items-center justify-center" style={{ minHeight: 120, color: '#94a3b8', fontSize: 13 }}>
              最近一周暂无提交记录
            </div>
          )}
        </div>

        {/* Unclosed Observations — 5 rows only */}
        <div className="card">
          <h2 className="section-title">待整改观察项</h2>
          <p className="text-xs text-slate-400" style={{ marginBottom: 8 }}>Unclosed Observations</p>
          <DataTable
            data={observations}
            total={total}
            page={1}
            pageSize={50}
            hidePagination
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
            loading={obsLoading}
          />
        </div>
      </div>
    </div>
  );
}

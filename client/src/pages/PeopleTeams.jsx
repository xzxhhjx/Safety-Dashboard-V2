import { useState } from 'react';
import Toolbar from '../components/layout/Toolbar';
import { useStats } from '../hooks/useStats';
import TopRiskBars from '../components/charts/TopRiskBars';
import DeptChart from '../components/charts/DeptChart';
import SubmitterChart from '../components/charts/SubmitterChart';
import { Users, Clock, Target, TrendingUp } from 'lucide-react';

const AVATAR_COLORS = ['#007AFF', '#34C759', '#FF9F0A', '#FF453A', '#5856D6', '#FF6B35', '#00C7BE', '#AF52DE'];

function getInitials(name) {
  if (!name) return '?';
  return name.split(/[\s,]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function PeopleTeams() {
  const [filters] = useState({});
  const { stats, loading } = useStats(filters);

  const deptPerf = [
    { name: 'HSE Department', value: 88 },
    { name: 'Construction Team', value: 72 },
    { name: 'Mechanical Team', value: 64 },
    { name: 'Electrical Team', value: 59 },
  ];

  return (
    <div>
      <Toolbar title="People & Teams" subtitle="Department performance and contributor insights" />

      <div className="px-8 py-6" style={{ maxWidth: 1440 }}>
        {/* Department Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h2 className="section-title">Department Performance</h2>
            <DeptChart data={stats?.deptRank} />
          </div>
          <div className="card">
            <h2 className="section-title">Close Rate by Department</h2>
            <div className="flex flex-col gap-2">
              {deptPerf.map((d, i) => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-xs font-medium flex-shrink-0" style={{ width: 150, color: 'var(--text-primary)' }}>{d.name}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
                    <div className="h-full rounded-full transition-all duration-600"
                      style={{ width: `${d.value}%`, background: AVATAR_COLORS[i % AVATAR_COLORS.length] }} />
                  </div>
                  <span className="text-xs font-semibold tabular-nums flex-shrink-0" style={{ width: 36, textAlign: 'right', color: 'var(--text-primary)' }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Contributors */}
        <div className="card mb-6">
          <h2 className="section-title">Top Contributors</h2>
          {stats?.submitterRank?.length > 0 ? (
            <div className="flex flex-col gap-1">
              {stats.submitterRank.slice(0, 10).map((s, i) => (
                <div key={s.name} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-black/[0.02] transition-colors"
                  style={{ borderBottom: i < Math.min(stats.submitterRank.length, 10) - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <span className="text-xs font-medium tabular-nums flex-shrink-0" style={{ width: 20, color: 'var(--text-secondary)' }}>{i + 1}</span>
                  <div className="avatar avatar-sm flex-shrink-0" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>{getInitials(s.name)}</div>
                  <span className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{s.value}</span>
                  <span className="text-xs flex-shrink-0" style={{ width: 80, textAlign: 'right', color: 'var(--text-secondary)' }}>submissions</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="chart-container flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>No contributor data</div>
          )}
        </div>

        {/* Team Insights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Avg Close Time', value: '3.2 days', icon: <Clock className="w-4 h-4" />, color: 'var(--system-blue)' },
            { label: 'Per Person Avg', value: '18 obs', icon: <Users className="w-4 h-4" />, color: 'var(--system-green)' },
            { label: 'Close Rate', value: `${stats?.closedRate || 0}%`, icon: <Target className="w-4 h-4" />, color: 'var(--system-orange)' },
            { label: 'Active Submitters', value: stats?.submitterRank?.length || 0, icon: <TrendingUp className="w-4 h-4" />, color: 'var(--system-purple)' },
          ].map(insight => (
            <div key={insight.label} className="card text-center" style={{ padding: '20px 16px' }}>
              <div className="mb-2 mx-auto" style={{ color: insight.color }}>{insight.icon}</div>
              <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{insight.value}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{insight.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

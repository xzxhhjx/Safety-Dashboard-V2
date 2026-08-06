import BaseChart from './BaseChart';
import { COLORS } from '../../config';

/**
 * Status Overview — Two-slice donut: 已关闭 (Closed) vs 未关闭 (Open).
 * Center shows the closed rate percentage.
 */
export default function StatusPie({ totalCount, closedRate }) {
  const total = totalCount || 0;
  const closedPct = closedRate || 0;
  const closedCount = Math.round(total * closedPct / 100);
  const openCount = total - closedCount;

  if (total === 0) {
    return (
      <div className="chart-container flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
        No data
      </div>
    );
  }

  const pieData = [
    { name: '已关闭', value: closedCount, itemStyle: { color: COLORS.SAFE } },
    { name: '未关闭', value: openCount, itemStyle: { color: COLORS.DANGER } },
  ];

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      borderColor: 'rgba(0, 0, 0, 0.08)',
      textStyle: { color: '#1D1D1F', fontSize: 13, fontFamily: 'inherit' },
      formatter: (p) =>
        `<b>${p.name}</b><br/><span style="color:#6E6E73">${p.value} 项 (${p.percent}%)</span>`,
    },
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '42%',
        style: {
          text: `${closedPct}%`,
          textAlign: 'center',
          fill: '#1D1D1F',
          fontSize: 28,
          fontWeight: '600',
          fontFamily: 'SF Pro Display, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '58%',
        style: {
          text: '关闭率',
          textAlign: 'center',
          fill: '#6E6E73',
          fontSize: 12,
          fontFamily: 'inherit',
        },
      },
    ],
    series: [{
      type: 'pie',
      radius: ['55%', '78%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 5 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 15, fontWeight: '600', formatter: '{d}%' },
        scale: true,
        scaleSize: 8,
      },
      data: pieData,
    }],
  };

  return (
    <div style={{ flex: 1, minHeight: 280 }}>
      <BaseChart option={option} height="100%" />
    </div>
  );
}

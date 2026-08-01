import BaseChart from './BaseChart';
import { STATUS_COLORS } from '../../config';

/**
 * Status Overview — Donut chart with center "Closed Rate" text.
 * Closed = green, Open = orange, everything else = red (overdue).
 */
export default function StatusPie({ data, closedRate }) {
  if (!data?.length) {
    return (
      <div className="chart-container flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
        No data
      </div>
    );
  }

  const pieData = data.map(d => ({
    name: d.name,
    value: d.value,
    itemStyle: { color: STATUS_COLORS[d.name] || '#FF453A' },
  }));

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      borderColor: 'rgba(0, 0, 0, 0.08)',
      textStyle: { color: '#1D1D1F', fontSize: 13, fontFamily: 'inherit' },
      formatter: (p) =>
        `<b>${p.name}</b><br/><span style="color:#6E6E73">${p.value} items (${p.percent}%)</span>`,
    },
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '42%',
        style: {
          text: `${closedRate || 0}%`,
          textAlign: 'center',
          fill: '#1D1D1F',
          fontSize: 26,
          fontWeight: '600',
          fontFamily: 'SF Pro Display, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '58%',
        style: {
          text: 'Closed Rate',
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
      itemStyle: { borderColor: '#F5F5F7', borderWidth: 2, borderRadius: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 15, fontWeight: '600', formatter: '{d}%' },
        scale: true,
        scaleSize: 6,
      },
      data: pieData,
    }],
  };

  return (
    <div className="chart-container">
      <BaseChart option={option} />
    </div>
  );
}

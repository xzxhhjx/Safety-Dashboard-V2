import BaseChart from './BaseChart';
import { CHART_COLORS } from '../../config';

const APPLE_COLORS = ['#007AFF', '#34C759', '#FF9F0A', '#FF453A', '#5856D6', '#8E8E93'];

/**
 * Hazard Distribution — Donut chart.
 *
 * By default: Top 5 categories + "Others" aggregation, legend on the right.
 * With showAll: every category rendered as its own slice, using full palette.
 */
export default function HazardChart({ data, showAll = false }) {
  if (!data?.length) {
    return (
      <div className="chart-container flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
        No data
      </div>
    );
  }

  let chartData;
  let colors;

  if (showAll) {
    colors = data.length <= CHART_COLORS.length ? CHART_COLORS : [...CHART_COLORS, ...APPLE_COLORS];
    chartData = data.map((d, i) => ({
      name: d.name,
      value: d.value,
      itemStyle: { color: colors[i % colors.length] },
    }));
  } else {
    const top5 = data.slice(0, 5);
    const othersValue = data.slice(5).reduce((sum, d) => sum + d.value, 0);
    chartData = top5.map((d, i) => ({
      name: d.name,
      value: d.value,
      itemStyle: { color: APPLE_COLORS[i] },
    }));
    if (othersValue > 0) {
      chartData.push({
        name: 'Others',
        value: othersValue,
        itemStyle: { color: APPLE_COLORS[5] },
      });
    }
  }

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      borderColor: 'rgba(0, 0, 0, 0.08)',
      textStyle: { color: '#1D1D1F', fontSize: 13, fontFamily: 'inherit' },
      formatter: (p) =>
        `<b>${p.name}</b><br/><span style="color:#6E6E73">${p.value} items (${p.percent}%)</span>`,
    },
    legend: {
      orient: 'vertical',
      right: 4,
      top: 'center',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: showAll ? 6 : 10,
      textStyle: { color: '#6E6E73', fontSize: showAll ? 11 : 12, fontFamily: 'inherit' },
    },
    series: [{
      type: 'pie',
      radius: ['50%', '72%'],
      center: ['38%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderColor: '#F5F5F7', borderWidth: 2, borderRadius: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 16, fontWeight: '600', formatter: '{d}%' },
        scale: true,
        scaleSize: 6,
      },
      data: chartData,
    }],
  };

  return (
    <div className="chart-container-tall">
      <BaseChart option={option} height="100%" />
    </div>
  );
}

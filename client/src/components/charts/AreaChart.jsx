import BaseChart from './BaseChart';
import { CHART_COLORS } from '../../config';

/**
 * Work Area Distribution — Apple-style horizontal bar chart.
 */
export default function AreaChart({ data }) {
  if (!data?.length) {
    return (
      <div className="chart-container-tall flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
        No data
      </div>
    );
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      borderColor: 'rgba(0, 0, 0, 0.08)',
      textStyle: { color: '#1D1D1F', fontSize: 13, fontFamily: 'inherit' },
    },
    grid: { left: 12, right: 24, top: 12, bottom: 12, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(d => d.name),
      axisLine: { lineStyle: { color: 'rgba(0, 0, 0, 0.08)' } },
      axisTick: { show: false },
      axisLabel: { color: '#6E6E73', fontSize: 11, fontFamily: 'inherit', rotate: 40 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(0, 0, 0, 0.06)', type: 'dashed' } },
      axisLabel: { color: '#6E6E73', fontSize: 11, fontFamily: 'inherit' },
    },
    series: [{
      type: 'bar',
      data: data.map((d, i) => ({
        value: d.value,
        itemStyle: {
          color: CHART_COLORS[i % CHART_COLORS.length],
          borderRadius: [4, 4, 0, 0],
        },
      })),
      barMaxWidth: 32,
    }],
  };

  return (
    <div className="chart-container-tall">
      <BaseChart option={option} height="100%" />
    </div>
  );
}

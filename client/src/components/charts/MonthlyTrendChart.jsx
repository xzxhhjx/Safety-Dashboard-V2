import BaseChart from './BaseChart';

/**
 * Safety Trend — Thin Apple-style line chart.
 * 2px blue line, subtle 8% area fill, no heavy gridlines.
 */
export default function MonthlyTrendChart({ data }) {
  if (!data?.length) {
    return (
      <div className="chart-container-wide flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
        No data
      </div>
    );
  }

  const values = data.map(d => d.value);
  const total = values.reduce((s, v) => s + v, 0);
  const avg = Math.round(total / (values.length || 1));
  const peak = Math.max(...values);

  const option = {
    tooltip: {
      trigger: 'axis',
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
      axisLabel: { color: '#6E6E73', fontSize: 11, fontFamily: 'inherit' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(0, 0, 0, 0.06)', type: 'dashed' } },
      axisLabel: { color: '#6E6E73', fontSize: 11, fontFamily: 'inherit' },
    },
    series: [{
      type: 'line',
      data: values,
      smooth: 0.3,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color: '#007AFF', width: 2 },
      itemStyle: { color: '#007AFF' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0, 122, 255, 0.12)' },
            { offset: 1, color: 'rgba(0, 122, 255, 0.0)' },
          ],
        },
      },
    }],
  };

  return (
    <div>
      {/* Summary stats */}
      <div className="flex gap-6 mb-3">
        <div>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{total}</span>
        </div>
        <div>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Monthly Avg </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{avg}</span>
        </div>
        <div>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Peak </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{peak}</span>
        </div>
      </div>
      <div className="chart-container-wide">
        <BaseChart option={option} height="100%" />
      </div>
    </div>
  );
}

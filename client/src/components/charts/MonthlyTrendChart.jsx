import BaseChart from './BaseChart';
import { CHART_COLORS } from '../../config';

export default function MonthlyTrendChart({ data }) {
  if (!data?.length) return <div className="chart-container flex items-center justify-center text-gray-600">No data</div>;

  const option = {
    tooltip: { trigger: 'axis' },
    title: { text: 'Monthly Trend', textStyle: { color: '#9CA3AF', fontSize: 14 } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.map(d => d.name), axisLabel: { color: '#9CA3AF' } },
    yAxis: { type: 'value', axisLabel: { color: '#9CA3AF' } },
    series: [{
      type: 'line',
      data: data.map(d => d.value),
      smooth: true,
      lineStyle: { color: CHART_COLORS[0], width: 3 },
      itemStyle: { color: CHART_COLORS[0] },
      areaStyle: { color: CHART_COLORS[0], opacity: 0.1 },
    }],
  };

  return <div className="chart-container"><BaseChart option={option} /></div>;
}

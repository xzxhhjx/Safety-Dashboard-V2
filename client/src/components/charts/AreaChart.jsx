import BaseChart from './BaseChart';
import { CHART_COLORS } from '../../config';

export default function AreaChart({ data }) {
  if (!data?.length) return <div className="chart-container flex items-center justify-center text-gray-600">No data</div>;

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', top: '3%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.map(d => d.name), axisLabel: { color: '#9CA3AF', rotate: 45 } },
    yAxis: { type: 'value', axisLabel: { color: '#9CA3AF' } },
    series: [{
      type: 'bar',
      data: data.map((d, i) => ({ value: d.value, itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] } })),
    }],
  };

  return <div className="chart-container-tall"><BaseChart option={option} height="100%" /></div>;
}

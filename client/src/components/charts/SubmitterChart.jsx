import BaseChart from './BaseChart';
import { CHART_COLORS } from '../../config';

export default function SubmitterChart({ data }) {
  if (!data?.length) return <div className="chart-container flex items-center justify-center text-gray-600">No data</div>;

  const option = {
    tooltip: { trigger: 'axis' },
    title: { text: 'Top Submitters', textStyle: { color: '#9CA3AF', fontSize: 14 } },
    grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', axisLabel: { color: '#9CA3AF' } },
    yAxis: { type: 'category', data: data.map(d => d.name).reverse(), axisLabel: { color: '#9CA3AF', width: 120, overflow: 'truncate' } },
    series: [{
      type: 'bar',
      data: data.map((d, i) => ({ value: d.value, itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] } })).reverse(),
      barMaxWidth: 30,
    }],
  };

  return <div className="chart-container"><BaseChart option={option} /></div>;
}
